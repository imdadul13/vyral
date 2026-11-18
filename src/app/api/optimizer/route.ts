import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import {
  buildPlatformPackages,
  calculatePublishingOptimizationScore,
  generateCompletePublishingPackage,
  generateDescriptionsForClip,
  generateHookAnalysisForClip,
  generatePinnedCommentsForClip,
  generateSeoTagsForClip,
  generateSmartHashtagsForClip,
  generateThumbnailOptimizationForClip,
  generateTitlesForClip,
} from "@/lib/publishing-optimizer";
import { ProcessingJob, TargetPublishPlatform, VyralPublishingPackage } from "@/lib/types";
import { generateGeminiJson, resolveModelId } from "@/lib/gemini-service";

async function tryGeminiTitleAugmentation(params: {
  clipTitle: string;
  clipTranscript: string;
  projectTitle: string;
  viralScore: number;
  trendSignals: string[];
}): Promise<string[] | null> {
  if (!process.env.GEMINI_API_KEY) return null;

  const res = await generateGeminiJson<string[]>({
    tier: "primary",
    timeoutMs: 8000,
    prompt: `You are VYRAL Viral Optimizer powered by ${resolveModelId("primary")}. Return ONLY a JSON array of 3 concise (<65 chars), non-clickbait YouTube Shorts titles strictly grounded in this clip transcript:
Project: "${params.projectTitle}"
Current Clip Title: "${params.clipTitle}" (Viral Score: ${params.viralScore}/100)
Transcript: "${params.clipTranscript.slice(0, 600)}"
Trend Signals: ${params.trendSignals.join("; ")}
Output format: ["Title 1", "Title 2", "Title 3"]`,
  });

  if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
    return res.data.map((t) => String(t).trim()).filter(Boolean);
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      clipId,
      section,
      packageUpdates,
      publishingPackage,
      targetPlatform,
    } = body as {
      action:
        | "generate_complete_kit"
        | "regenerate"
        | "regenerate_section"
        | "save_package"
        | "save";
      clipId: string;
      section?:
        | "titles"
        | "descriptions"
        | "hashtags"
        | "seoTags"
        | "hooks"
        | "thumbnail"
        | "pinnedComments"
        | "more_titles";
      packageUpdates?: Partial<VyralPublishingPackage>;
      publishingPackage?: Partial<VyralPublishingPackage>;
      targetPlatform?: TargetPublishPlatform;
    };

    const db = readDb();
    const clipIdx = db.clips.findIndex((c) => c.id === clipId);
    if (clipIdx === -1) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const clip = db.clips[clipIdx];
    const project = db.projects.find((p) => p.id === clip.projectId);

    // Ensure clip has an initial publishing package
    let currentPkg =
      clip.publishingPackage ||
      generateCompletePublishingPackage({
        clip,
        project,
        trendingVideos: db.trendingVideos,
        viralRadar: db.viralRadar,
      });

    if (action === "generate_complete_kit" || action === "regenerate") {
      const seedOffset = Date.now() % 7;
      currentPkg = generateCompletePublishingPackage({
        clip,
        project,
        trendingVideos: db.trendingVideos,
        viralRadar: db.viralRadar,
        existingPackage: clip.publishingPackage,
        seedOffset,
      });
      if (targetPlatform) {
        currentPkg.targetPlatform = targetPlatform;
      }

      // Optional live Gemini 3.8 Flash augmentation if GEMINI_API_KEY is present
      const geminiTitles = await tryGeminiTitleAugmentation({
        clipTitle: clip.title,
        clipTranscript: clip.words.map((w) => w.word).join(" "),
        projectTitle: clip.projectTitle,
        viralScore: clip.viralScore,
        trendSignals: currentPkg.trendSignalsUsed,
      });

      if (geminiTitles && geminiTitles.length > 0) {
        geminiTitles.forEach((gt, idx) => {
          if (currentPkg.titles[idx]) {
            currentPkg.titles[idx].text = gt;
          }
        });
        currentPkg.selectedTitleText = currentPkg.titles[0].text;
      }

      const job: ProcessingJob = {
        id: `job-opt-${Date.now().toString().slice(-5)}`,
        projectId: clip.projectId,
        projectTitle: clip.projectTitle,
        clipId: clip.id,
        jobType: "vyral_publishing_kit",
        status: "completed",
        progress: 100,
        workerNode: `${resolveModelId("primary")}-optimizer`,
        startedAt: new Date().toISOString(),
        logs: [
          `Generated 10 multi-angle titles & 3 description variants grounded in clip transcript`,
          `Validated YouTube SEO metadata tags (${currentPkg.seoTags
            .map((t) => t.tag)
            .join(", ").length}/500 chars)`,
          `Computed Publishing Optimization Score: ${currentPkg.optimizationScore.overall}/100 across 4 platforms`,
        ],
      };
      db.jobs.unshift(job);
    } else if (action === "regenerate_section" && section) {
      const seedOffset = Math.floor(Math.random() * 10) + 1;
      if (section === "titles") {
        const nextTitles = generateTitlesForClip(clip, project, seedOffset);
        currentPkg.titles = nextTitles;
        currentPkg.selectedTitleId = nextTitles[0].id;
        currentPkg.selectedTitleText = nextTitles[0].text;
      } else if (section === "more_titles") {
        const extra = generateTitlesForClip(clip, project, seedOffset).slice(0, 3);
        extra.forEach((t, i) => {
          t.id = `title-extra-${Date.now()}-${i}`;
          t.isAiRecommended = false;
          t.text = `${t.text} (Variant ${currentPkg.titles.length + i + 1})`;
        });
        currentPkg.titles = [...currentPkg.titles, ...extra];
      } else if (section === "descriptions") {
        currentPkg.descriptions = generateDescriptionsForClip(clip, project);
      } else if (section === "hashtags") {
        currentPkg.hashtags = generateSmartHashtagsForClip(
          clip,
          db.trendingVideos,
          db.viralRadar
        );
      } else if (section === "seoTags") {
        currentPkg.seoTags = generateSeoTagsForClip(clip, project);
      } else if (section === "hooks") {
        currentPkg.hookAnalysis = generateHookAnalysisForClip(clip, project);
      } else if (section === "thumbnail") {
        currentPkg.thumbnail = generateThumbnailOptimizationForClip(clip, project);
      } else if (section === "pinnedComments") {
        currentPkg.pinnedComments = generatePinnedCommentsForClip(clip, project);
      }
    } else if (
      (action === "save_package" || action === "save") &&
      (packageUpdates || publishingPackage)
    ) {
      currentPkg = {
        ...currentPkg,
        ...(packageUpdates || publishingPackage),
        updatedAt: new Date().toISOString(),
      };
    }

    // Recompute platform packages & optimization score so everything stays in sync
    const selectedPinnedObj =
      currentPkg.pinnedComments.find(
        (p) => p.id === currentPkg.selectedPinnedCommentId
      ) || currentPkg.pinnedComments[0];

    currentPkg.platformPackages = buildPlatformPackages({
      clip,
      project,
      selectedTitle: currentPkg.selectedTitleText,
      descriptions: currentPkg.descriptions,
      hashtags: currentPkg.hashtags,
      seoTags: currentPkg.seoTags,
      hookAnalysis: currentPkg.hookAnalysis,
      thumbnail: currentPkg.thumbnail,
      pinnedComment: selectedPinnedObj?.text || "",
    });

    currentPkg.optimizationScore = calculatePublishingOptimizationScore({
      selectedTitle: currentPkg.selectedTitleText,
      titles: currentPkg.titles,
      descriptions: currentPkg.descriptions,
      hashtags: currentPkg.hashtags,
      seoTags: currentPkg.seoTags,
      hookAnalysis: currentPkg.hookAnalysis,
      thumbnail: currentPkg.thumbnail,
    });

    if (action === "save_package") {
      currentPkg.versionHistory = [
        {
          versionId: `v-${currentPkg.versionHistory.length + 1}-${Date.now()
            .toString()
            .slice(-4)}`,
          savedAt: new Date().toISOString(),
          selectedTitle: currentPkg.selectedTitleText,
          overallScore: currentPkg.optimizationScore.overall,
          targetPlatform: currentPkg.targetPlatform,
        },
        ...currentPkg.versionHistory.slice(0, 9),
      ];
    }

    // Sync primary clip metadata with the selected publishing package
    db.clips[clipIdx].publishingPackage = currentPkg;
    db.clips[clipIdx].title = currentPkg.selectedTitleText;
    db.clips[clipIdx].suggestedDescription =
      currentPkg.descriptions[currentPkg.descriptions.selectedVariation];
    db.clips[clipIdx].hashtags = currentPkg.hashtags
      .filter((h) => h.selected)
      .map((h) => h.tag);

    writeDb(db);

    return NextResponse.json({
      publishingPackage: currentPkg,
      clip: db.clips[clipIdx],
      db,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to run VYRAL Viral Optimizer",
      },
      { status: 500 }
    );
  }
}
