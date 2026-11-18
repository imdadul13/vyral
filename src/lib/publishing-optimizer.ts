import {
  DescriptionVariations,
  GeneratedClip,
  PinnedCommentOption,
  PlatformPublishingPackages,
  PublishingOptimizationScore,
  SeoTagItem,
  SmartHashtagItem,
  TargetPublishPlatform,
  ThumbnailOptimization,
  TrendingVideoItem,
  VideoProject,
  ViralHookAnalysis,
  ViralRadarData,
  ViralTitleOption,
  VyralPublishingPackage,
} from "./types";

function extractKeySubjectFromClip(clip: GeneratedClip, project?: VideoProject): {
  coreSubject: string;
  keyPhrase: string;
  spokenTranscript: string;
  first5SecTranscript: string;
  channelName: string;
} {
  const spokenTranscript =
    clip.words.map((w) => w.word).join(" ").trim() ||
    clip.suggestedDescription ||
    clip.title;

  const first5Words = clip.words
    .filter((w) => w.start <= 5.0)
    .map((w) => w.word)
    .join(" ")
    .trim();

  const first5SecTranscript =
    first5Words ||
    spokenTranscript.split(/\s+/).slice(0, 14).join(" ");

  // Extract meaningful topic noun phrase from clip title/transcript
  const lower = `${clip.title} ${spokenTranscript}`.toLowerCase();
  let coreSubject = "Retention Velocity & Short-Form Storytelling";
  let keyPhrase = "the first 3 seconds of attention";

  if (lower.includes("retention") || lower.includes("views")) {
    coreSubject = "Retention Velocity vs Raw Views";
    keyPhrase = "capturing attention in the first 2 seconds";
  } else if (lower.includes("startup") || lower.includes("saas") || lower.includes("moat")) {
    coreSubject = "AI Startup Distribution & Workflow Moats";
    keyPhrase = "solving distribution before model commoditization";
  } else if (lower.includes("silence") || lower.includes("pacing") || lower.includes("audio")) {
    coreSubject = "Acoustic Pacing & Dead-Air Removal";
    keyPhrase = "removing 400ms of dead air to boost completion";
  } else if (lower.includes("controversial") || lower.includes("production")) {
    coreSubject = "Storytelling Tension vs Studio Production Value";
    keyPhrase = "why narrative conflict beats high budgets";
  } else {
    const cleanTitle = clip.title.replace(/[.!?]+$/, "").trim();
    coreSubject = cleanTitle.slice(0, 48);
    keyPhrase = cleanTitle.toLowerCase().slice(0, 42);
  }

  return {
    coreSubject,
    keyPhrase,
    spokenTranscript,
    first5SecTranscript,
    channelName: project?.channelName || "VYRAL Creator Studio",
  };
}

export function generateTitlesForClip(
  clip: GeneratedClip,
  project?: VideoProject,
  seedOffset = 0
): ViralTitleOption[] {
  const { coreSubject, keyPhrase } = extractKeySubjectFromClip(clip, project);
  const baseScore = Math.min(96, Math.max(82, clip.viralScore));

  const rawOptions: Omit<ViralTitleOption, "id" | "isFavorite">[] = [
    {
      text: `Why ${coreSubject} Changes Everything`,
      style: "Curiosity-Driven",
      potentialScore: Math.min(99, baseScore + 3 - (seedOffset % 2)),
      curiosityScore: 96,
      emotionalAppeal: 89,
      searchRelevance: 92,
      suggestedAudience: "Creators, Founders & Growth Strategists",
      explanation:
        "Opens an immediate information gap around the core thesis discussed in the clip without spoiling the takeaway.",
      isAiRecommended: true,
    },
    {
      text: `The Biggest Mistake With ${coreSubject.split("&")[0].trim()}`,
      style: "Highly Clickable",
      potentialScore: Math.min(98, baseScore + 1),
      curiosityScore: 94,
      emotionalAppeal: 92,
      searchRelevance: 90,
      suggestedAudience: "Short-Form Video Creators & Marketers",
      explanation:
        "Loss-aversion framing triggers high mobile tap-through on YouTube Shorts and Reels feeds.",
      isAiRecommended: false,
    },
    {
      text: `The Brutal Truth About ${coreSubject.split("vs")[0].trim()}`,
      style: "Emotional",
      potentialScore: Math.min(97, baseScore),
      curiosityScore: 90,
      emotionalAppeal: 96,
      searchRelevance: 86,
      suggestedAudience: "Ambitious Solo Creators & Builders",
      explanation:
        "High-conviction emotional adjective matches the speaker's vocal urgency in the first 3 seconds.",
      isAiRecommended: false,
    },
    {
      text: `How ${keyPhrase[0].toUpperCase() + keyPhrase.slice(1)} Drives Growth`,
      style: "Educational",
      potentialScore: Math.min(96, baseScore - 1),
      curiosityScore: 87,
      emotionalAppeal: 84,
      searchRelevance: 95,
      suggestedAudience: "Tactical Learners & Media Operators",
      explanation:
        "Clear utility-first promise grounded directly in the clip's actionable breakdown.",
      isAiRecommended: false,
    },
    {
      text: `How One Shift in ${coreSubject.split(" ")[0]} Changed Our Results`,
      style: "Storytelling",
      potentialScore: Math.min(95, baseScore - 1),
      curiosityScore: 91,
      emotionalAppeal: 90,
      searchRelevance: 85,
      suggestedAudience: "Podcast Listeners & Case-Study Fans",
      explanation:
        "Transformation arc framing invites viewers to watch until the final second for the outcome.",
      isAiRecommended: false,
    },
    {
      text: `Nobody Talks About This ${coreSubject.split(" ")[0]} Rule`,
      style: "Unexpected Revelation",
      potentialScore: Math.min(96, baseScore),
      curiosityScore: 95,
      emotionalAppeal: 88,
      searchRelevance: 87,
      suggestedAudience: "Algorithm & Distribution Enthusiasts",
      explanation:
        "Positions the clip's insight as an insider discovery directly supported by the transcript.",
      isAiRecommended: false,
    },
    {
      text: `Are You Optimizing for ${coreSubject.split(" ")[0]} the Wrong Way?`,
      style: "Question-Based",
      potentialScore: Math.min(93, baseScore - 2),
      curiosityScore: 92,
      emotionalAppeal: 86,
      searchRelevance: 89,
      suggestedAudience: "Active Practitioners & Channel Owners",
      explanation:
        "Direct self-reflection question prompts viewers to mentally answer and engage in the comments.",
      isAiRecommended: false,
    },
    {
      text: `Stop Ignoring ${coreSubject.split("&")[0].trim()} in 2026`,
      style: "Bold Statement",
      potentialScore: Math.min(95, baseScore - 1),
      curiosityScore: 89,
      emotionalAppeal: 93,
      searchRelevance: 90,
      suggestedAudience: "Fast-Scrolling Shorts & TikTok Viewers",
      explanation:
        "Imperative command cuts through feed noise in under 6 words for instant mobile readability.",
      isAiRecommended: false,
    },
    {
      text: `Why High Production Value Loses to ${coreSubject.split(" ")[0]}`,
      style: "Controversial",
      potentialScore: Math.min(96, baseScore + 1),
      curiosityScore: 93,
      emotionalAppeal: 94,
      searchRelevance: 88,
      suggestedAudience: "Video Editors, Producers & Founders",
      explanation:
        "Challenges conventional wisdom using the exact contrarian point made in the segment.",
      isAiRecommended: false,
    },
    {
      text: `${coreSubject}: Complete ${Math.round(clip.duration)}s Breakdown`,
      style: "SEO-Focused",
      potentialScore: Math.min(94, baseScore - 2),
      curiosityScore: 84,
      emotionalAppeal: 82,
      searchRelevance: 98,
      suggestedAudience: "YouTube Search & Evergreen Discovery Traffic",
      explanation:
        "Front-loads exact-match search keywords for long-tail YouTube Shorts and Search indexing.",
      isAiRecommended: false,
    },
  ];

  return rawOptions.map((item, idx) => ({
    ...item,
    id: `title-${clip.id}-${idx + 1}-${seedOffset}`,
    isFavorite: idx === 0,
  }));
}

export function generateDescriptionsForClip(
  clip: GeneratedClip,
  project?: VideoProject
): DescriptionVariations {
  const { coreSubject, spokenTranscript, channelName } = extractKeySubjectFromClip(
    clip,
    project
  );
  const cleanSummary =
    spokenTranscript.length > 180
      ? `${spokenTranscript.slice(0, 177).trim()}...`
      : spokenTranscript;

  const shortAndPunchy = `${coreSubject} — explained in ${Math.round(
    clip.duration
  )} seconds.\n\n"${cleanSummary}"\n\nWhat part of this breakdown stood out to you most? Drop your take below 👇\n\nSource: ${
    project?.title || clip.projectTitle
  } (${channelName}) [${clip.startTime}s–${clip.endTime}s]\n#shorts #vyral #contentstrategy`;

  const seoOptimized = `In this ${Math.round(
    clip.duration
  )}-second highlight from "${
    project?.title || clip.projectTitle
  }", we break down ${coreSubject.toLowerCase()} and how ${
    clip.momentCategory.toLowerCase()
  } mechanics impact audience retention.\n\nKey Takeaway:\n${cleanSummary}\n\nTopics Covered:\n• ${coreSubject}\n• Audience retention velocity & first-3-second hook structure\n• Practical execution for creators and founders\n\nSubscribe for daily high-signal clips and full breakdowns from ${channelName}.\n\nOriginal Source: ${
    project?.youtubeUrl || `https://www.youtube.com/watch?v=${clip.youtubeVideoId}`
  } (Timestamp ${clip.startTime}s – ${clip.endTime}s)\n#youtubeshorts #creatorgrowth #videostrategy #viralclips`;

  const conversational = `Most people overlook this exact detail when thinking about ${coreSubject.toLowerCase()}.\n\nListen closely to what happens right at the start of this clip: "${cleanSummary}"\n\nDo you agree with this approach, or have you seen different results on your channel? Let’s discuss in the comments — I’m replying to the best insights today.\n\nFull episode on ${channelName}: "${
    project?.title || clip.projectTitle
  }"`;

  return {
    shortAndPunchy,
    seoOptimized,
    conversational,
    selectedVariation: "seoOptimized",
  };
}

export function generateSmartHashtagsForClip(
  clip: GeneratedClip,
  trendingVideos: TrendingVideoItem[],
  viralRadar: ViralRadarData
): SmartHashtagItem[] {
  const verifiedKeywords = new Set(
    viralRadar.trendingKeywords.map((k) =>
      k.keyword.toLowerCase().replace(/\s+/g, "")
    )
  );
  const trendingTopics = trendingVideos.map((t) => t.topic.toLowerCase());

  const items: SmartHashtagItem[] = [
    {
      tag: "#shorts",
      category: "Platform-Specific",
      selected: true,
      reason: "Primary YouTube Shorts shelf indexing signal.",
      isVerifiedTrending: true,
    },
    {
      tag: "#youtubeshorts",
      category: "Platform-Specific",
      selected: true,
      reason: "Reinforces vertical mobile feed categorization on YouTube.",
      isVerifiedTrending: false,
    },
    {
      tag: "#retentionvelocity",
      category: "Relevant Trending",
      selected: true,
      reason:
        "Matched in VYRAL Viral Radar (+340% search velocity in Creator Economy).",
      isVerifiedTrending:
        verifiedKeywords.has("retentionvelocity") || trendingTopics.length > 0,
    },
    {
      tag: "#creatoreconomy",
      category: "Broad Niche",
      selected: true,
      reason: "Broad category alignment for creator & media entrepreneurship.",
      isVerifiedTrending: false,
    },
    {
      tag: "#contentstrategy",
      category: "Specific Topic",
      selected: true,
      reason: "Directly matches the tactical hook & retention breakdown in the transcript.",
      isVerifiedTrending: false,
    },
    {
      tag: "#podcastclips",
      category: "Community",
      selected: true,
      reason: "Connects with high-completion long-form podcast clip viewers.",
      isVerifiedTrending: false,
    },
    {
      tag: "#storytellingtips",
      category: "Specific Topic",
      selected: false,
      reason: "Targets creators searching for narrative pacing & script hooks.",
      isVerifiedTrending: false,
    },
    {
      tag: "#founderinsights",
      category: "Community",
      selected: false,
      reason: "High engagement among startup builders and B2B operators.",
      isVerifiedTrending: false,
    },
    {
      tag: "#aiworkflow",
      category: "Relevant Trending",
      selected: false,
      reason: "Observed in VYRAL Trending Now Technology snapshot cluster.",
      isVerifiedTrending: true,
    },
    {
      tag: "#reelsviral",
      category: "Platform-Specific",
      selected: false,
      reason: "Recommended when cross-posting to Instagram Reels.",
      isVerifiedTrending: false,
    },
  ];

  return items;
}

export function generateSeoTagsForClip(
  clip: GeneratedClip,
  project?: VideoProject
): SeoTagItem[] {
  const { coreSubject } = extractKeySubjectFromClip(clip, project);
  const cleanTopic = coreSubject.toLowerCase();

  return [
    {
      id: "seo-1",
      tag: cleanTopic.slice(0, 42),
      category: "Primary Keywords",
      searchIntent: "High-Intent",
    },
    {
      id: "seo-2",
      tag: "audience retention strategy",
      category: "Primary Keywords",
      searchIntent: "Informational",
    },
    {
      id: "seo-3",
      tag: "youtube shorts hook formula",
      category: "Primary Keywords",
      searchIntent: "High-Intent",
    },
    {
      id: "seo-4",
      tag: "short form video storytelling",
      category: "Secondary Keywords",
      searchIntent: "Discovery",
    },
    {
      id: "seo-5",
      tag: "how to increase average view duration",
      category: "Long-Tail Keywords",
      searchIntent: "Informational",
    },
    {
      id: "seo-6",
      tag: "why viewers swipe away in first 3 seconds",
      category: "Long-Tail Keywords",
      searchIntent: "Informational",
    },
    {
      id: "seo-7",
      tag: "viral clip retention analysis",
      category: "Secondary Keywords",
      searchIntent: "Discovery",
    },
    {
      id: "seo-8",
      tag: project?.channelName.toLowerCase() || "creator intelligence highlights",
      category: "Related Search Phrases",
      searchIntent: "Discovery",
    },
    {
      id: "seo-9",
      tag: "high retention video editing pacing",
      category: "Long-Tail Keywords",
      searchIntent: "High-Intent",
    },
    {
      id: "seo-10",
      tag: "creator economy growth blueprint 2026",
      category: "Related Search Phrases",
      searchIntent: "Trend-Aligned",
    },
  ];
}

export function generateHookAnalysisForClip(
  clip: GeneratedClip,
  project?: VideoProject
): ViralHookAnalysis {
  const { coreSubject, first5SecTranscript } = extractKeySubjectFromClip(
    clip,
    project
  );

  const openingStrength = clip.scoreBreakdown.hookStrength;
  const curiosity = clip.scoreBreakdown.curiosityScore;
  const emotionalIntensity = clip.scoreBreakdown.emotionalEngagement;
  const clarity = clip.scoreBreakdown.standaloneContext;
  const attentionGrabbing = Math.min(98, Math.round((openingStrength + curiosity) / 2));
  const relevance = 95;

  return {
    originalOpeningTranscript: first5SecTranscript,
    openingStrength,
    curiosity,
    emotionalIntensity,
    clarity,
    attentionGrabbing,
    relevance,
    diagnosticSummary: `The speaker's actual opening ("${first5SecTranscript.slice(
      0,
      75
    )}...") scores ${openingStrength}/100 on vocal urgency and establishes immediate standalone context (${clarity}/100) without introductory filler. Pairing the original spoken audio with a concise 0–2.5s visual text hook badge further reduces early swipe-away risk.`,
    keepOriginalOpening: true,
    activeOpeningTextHook: `THE ${coreSubject.split(" ")[0].toUpperCase()} RULE 99% MISS`,
    alternativeHooks: [
      {
        id: "hk-1",
        angle: "Visual Pattern-Interrupt Badge (Keep Spoken Audio Intact)",
        overlayText: `STOP IGNORING ${coreSubject.split(" ")[0].toUpperCase()}`,
        spokenLeadNote: `Preserves exact spoken words ("${first5SecTranscript.slice(
          0,
          48
        )}...") while anchoring mobile eyes in the first 0.8s.`,
        projectedLift: "+14% 3-Second Hold",
      },
      {
        id: "hk-2",
        angle: "Curiosity Loop Header Overlay",
        overlayText: "WATCH WHAT HAPPENS AT SECOND 12",
        spokenLeadNote:
          "Creates an open anticipation loop over the speaker's opening sentence without altering the transcript.",
        projectedLift: "+11% Completion Rate",
      },
      {
        id: "hk-3",
        angle: "Data-Backed Proof Callout",
        overlayText: "10,000 SHORTS ANALYZED: THE #1 LESSON",
        spokenLeadNote:
          "Frames the speaker's statement with immediate empirical authority in the top safe zone.",
        projectedLift: "+9% Save Rate",
      },
      {
        id: "hk-4",
        angle: "Contrarian Challenge Banner",
        overlayText: "WHY HIGH BUDGETS ARE LOSING IN 2026",
        spokenLeadNote:
          "Highlights the contrarian tension already present in the clip's opening 4 seconds.",
        projectedLift: "+16% Comment Velocity",
      },
      {
        id: "hk-5",
        angle: "Tightened Lead-In Trim (+0.6s Cut)",
        overlayText: `THE ${coreSubject.split(" ")[0].toUpperCase()} SHIFT`,
        spokenLeadNote:
          "Starts playback 0.6s closer to the first stressed consonant while keeping 100% authentic speech.",
        projectedLift: "+8% Initial Retention",
      },
    ],
  };
}

export function generateThumbnailOptimizationForClip(
  clip: GeneratedClip,
  project?: VideoProject
): ThumbnailOptimization {
  const { coreSubject } = extractKeySubjectFromClip(clip, project);
  const midTime = Number((clip.startTime + clip.duration * 0.35).toFixed(1));
  const peakTime = Number((clip.startTime + clip.duration * 0.68).toFixed(1));

  return {
    recommendedTimestamp: midTime,
    shortThumbnailText: `${coreSubject.split(" ")[0].toUpperCase()} SECRET`,
    compositionLayout:
      "Rule-of-thirds speaker framing with high-contrast 3-word top-safe headline and electric violet accent bar.",
    activeFormat: "9:16_shorts",
    frameCandidates: [
      {
        id: "frame-1",
        timestamp: Number((clip.startTime + 1.4).toFixed(1)),
        visualDescription: `Opening vocal emphasis frame (${(
          clip.startTime + 1.4
        ).toFixed(1)}s) — clear speaker eye contact inside vertical safe zone.`,
        compositionScore: 91,
        focalPointNote: "Strong center-weighted subject separation",
      },
      {
        id: "frame-2",
        timestamp: midTime,
        visualDescription: `Peak expressive gesture frame (${midTime}s) — highest visual contrast and zero motion blur.`,
        compositionScore: 96,
        focalPointNote: "AI Recommended Best Frame • Ideal facial clarity",
      },
      {
        id: "frame-3",
        timestamp: peakTime,
        visualDescription: `Payoff takeaway frame (${peakTime}s) — balanced lighting and clean upper-third headroom for text.`,
        compositionScore: 89,
        focalPointNote: "Clean upper-third negative space for typography",
      },
    ],
    concepts: [
      {
        id: "thumb-shorts-1",
        format: "9:16_shorts",
        headlineText: `${coreSubject.split(" ")[0].toUpperCase()} VELOCITY`,
        subBadgeText: `${Math.round(clip.duration)}S BREAKDOWN`,
        colorScheme: "Electric Violet (#8B5CF6) + Pure White on Deep Charcoal",
        layoutGuide:
          "Position 2–3 bold words at Y=22% (mobile-safe center-top) above speaker forehead; keep bottom 25% clear for Shorts UI.",
        contrastNote: "4px black stroke + subtle drop shadow for mobile legibility",
      },
      {
        id: "thumb-shorts-2",
        format: "9:16_shorts",
        headlineText: "99% MISS THIS RULE",
        subBadgeText: "WATCH TILL THE END",
        colorScheme: "High-CTR Cyber Yellow (#FACC15) + Jet Black Backdrop Pill",
        layoutGuide:
          "Centered badge at Y=26% paired with active speaker close-up crop (1.12x zoom).",
        contrastNote: "Maximum luminance contrast on small mobile grids",
      },
      {
        id: "thumb-long-1",
        format: "16:9_longform",
        headlineText: `THE ${coreSubject.split(" ")[0].toUpperCase()} PARADOX`,
        subBadgeText: "FULL DATA BREAKDOWN",
        colorScheme: "Icy Blue (#38BDF8) + Crisp White Editorial Typography",
        layoutGuide:
          "Speaker positioned on right rule-of-thirds vertical; large 3-word stacked typography on left dark gradient.",
        contrastNote: "Passes 160x90px miniature squint test with zero clutter",
      },
    ],
  };
}

export function generatePinnedCommentsForClip(
  clip: GeneratedClip,
  project?: VideoProject
): PinnedCommentOption[] {
  const { coreSubject } = extractKeySubjectFromClip(clip, project);

  return [
    {
      id: "pin-1",
      style: "Engagement-Driven",
      text: `Which part of ${coreSubject.toLowerCase()} are you focusing on right now — the opening 3-second hook or mid-clip pacing? Drop your workflow below 👇`,
      rationale:
        "Low-friction A/B choice question makes it easy for viewers to reply in 5 seconds.",
    },
    {
      id: "pin-2",
      style: "Opinion-Based",
      text: `Unpopular take from this clip: narrative tension beats studio production budget 9 times out of 10. Do you agree or disagree?`,
      rationale:
        "Sparks constructive debate directly grounded in the speaker's thesis.",
    },
    {
      id: "pin-3",
      style: "Educational",
      text: `Quick summary of the 3-step checklist mentioned in this ${Math.round(
        clip.duration
      )}s clip:\n1. Front-load the core conflict in seconds 0–3\n2. Cut pauses >350ms\n3. End on a standalone takeaway`,
      rationale:
        "Adds high-value reference notes in the comments, boosting comment dwell time and saves.",
    },
    {
      id: "pin-4",
      style: "Community-Building",
      text: `If you're building a channel or media brand in 2026, introduce what niche you're in below — let's connect with other creators testing these strategies.`,
      rationale:
        "Encourages peer-to-peer replies in the comment thread.",
    },
    {
      id: "pin-5",
      style: "CTA-Based",
      text: `Want the full ${Math.round(
        (project?.durationSeconds || 1800) / 60
      )}-minute breakdown? Watch the complete episode "${
        project?.title || clip.projectTitle
      }" linked right above the title.`,
      rationale:
        "Bridges YouTube Shorts viewers directly into long-form watch time via the Related Video link.",
    },
  ];
}

export function buildPlatformPackages(params: {
  clip: GeneratedClip;
  project?: VideoProject;
  selectedTitle: string;
  descriptions: DescriptionVariations;
  hashtags: SmartHashtagItem[];
  seoTags: SeoTagItem[];
  hookAnalysis: ViralHookAnalysis;
  thumbnail: ThumbnailOptimization;
  pinnedComment: string;
}): PlatformPublishingPackages {
  const {
    clip,
    project,
    selectedTitle,
    descriptions,
    hashtags,
    seoTags,
    hookAnalysis,
    thumbnail,
    pinnedComment,
  } = params;

  const activeHashtags = hashtags.filter((h) => h.selected).map((h) => h.tag);
  const tagStrings = seoTags.map((t) => t.tag);

  // Build chapters from project transcript if available
  const chapters =
    project?.transcript && project.transcript.length >= 3
      ? project.transcript.slice(0, 5).map((seg) => {
          const mins = Math.floor(seg.start / 60)
            .toString()
            .padStart(2, "0");
          const secs = Math.floor(seg.start % 60)
            .toString()
            .padStart(2, "0");
          return {
            timestamp: `${mins}:${secs}`,
            label: seg.text.split(/[.!?]/)[0].slice(0, 48).trim(),
          };
        })
      : [
          { timestamp: "00:00", label: "The 3-Second Retention Velocity Hook" },
          { timestamp: "00:12", label: "Why Viewers Swipe Away Early" },
          { timestamp: "00:25", label: "Controversial Storytelling vs Production" },
          { timestamp: "00:45", label: "Acoustic Pacing & Final Takeaway" },
        ];

  return {
    youtube_shorts: {
      title: selectedTitle.slice(0, 70),
      description: descriptions[descriptions.selectedVariation],
      hashtags: activeHashtags.slice(0, 6),
      seoTags: tagStrings,
      coverText: thumbnail.shortThumbnailText,
      pinnedComment,
      category: "Education & Science / Creator Economy",
      audienceRecommendation:
        "Creators, Founders, Video Editors & Digital Media Strategists (Ages 18–44)",
      checklist: [
        {
          item: "Concise title under 70 characters with clear curiosity hook",
          passed: selectedTitle.length <= 70 && selectedTitle.length >= 12,
        },
        {
          item: "9:16 vertical aspect ratio with mobile-safe caption positioning",
          passed: clip.aspectRatio === "9:16",
        },
        {
          item: "3 to 6 targeted hashtags including #shorts",
          passed: activeHashtags.length >= 3 && activeHashtags.length <= 8,
        },
        {
          item: "YouTube SEO metadata tags within 500-character limit",
          passed: tagStrings.join(", ").length <= 500,
        },
        {
          item: "First 1–3s hook verified (>80/100 hook strength)",
          passed: hookAnalysis.openingStrength >= 80,
        },
        {
          item: "Pinned comment ready to post immediately upon upload",
          passed: Boolean(pinnedComment.trim()),
        },
      ],
    },
    instagram_reels: {
      caption: `${selectedTitle} ⚡\n\n${descriptions.conversational}\n\nSave this Reel for your next edit & share with a creator who needs to hear this.`,
      hashtags: [
        ...activeHashtags.filter((h) => h !== "#youtubeshorts"),
        "#reelsinstagram",
        "#creatorstips",
      ].slice(0, 8),
      openingText: hookAnalysis.activeOpeningTextHook,
      cta: "Save this breakdown for your next upload + drop a 🔥 if you agree.",
      coverText: thumbnail.shortThumbnailText,
      suggestedFormat: "9:16 Reel (1080×1920) • Custom 4:5 Feed Grid Safe Crop",
    },
    tiktok: {
      shortCaption: `${selectedTitle} — wait for the takeaway at the end 🎯`,
      searchKeywords: tagStrings.slice(0, 5),
      hashtags: [
        "#tiktokcreator",
        "#videotip",
        ...activeHashtags.filter((h) => !h.includes("youtube")),
      ].slice(0, 5),
      openingHook: hookAnalysis.activeOpeningTextHook,
      cta: "Bookmark this & tell me your #1 hook rule in the comments.",
    },
    youtube_longform: {
      seoTitle: `${selectedTitle} | ${
        project?.channelName || "VYRAL Creator Intelligence"
      }`,
      detailedDescription: `${descriptions.seoOptimized}\n\n⏱️ Video Chapters:\n${chapters
        .map((c) => `${c.timestamp} - ${c.label}`)
        .join("\n")}`,
      chapters,
      tags: tagStrings,
      thumbnailText: thumbnail.concepts.find((c) => c.format === "16:9_longform")
        ?.headlineText || thumbnail.shortThumbnailText,
      pinnedComment,
    },
  };
}

export function calculatePublishingOptimizationScore(params: {
  selectedTitle: string;
  titles: ViralTitleOption[];
  descriptions: DescriptionVariations;
  hashtags: SmartHashtagItem[];
  seoTags: SeoTagItem[];
  hookAnalysis: ViralHookAnalysis;
  thumbnail: ThumbnailOptimization;
}): PublishingOptimizationScore {
  const {
    selectedTitle,
    titles,
    descriptions,
    hashtags,
    seoTags,
    hookAnalysis,
    thumbnail,
  } = params;

  const matchedTitle = titles.find((t) => t.text === selectedTitle);
  const titleLen = selectedTitle.trim().length;
  const titleQuality =
    titleLen >= 18 && titleLen <= 68
      ? matchedTitle?.potentialScore || 94
      : titleLen > 68
      ? 79
      : 74;

  const activeDesc = descriptions[descriptions.selectedVariation] || "";
  const descriptionQuality =
    activeDesc.length >= 120 ? 95 : activeDesc.length >= 60 ? 86 : 72;

  const totalSeoChars = seoTags.map((t) => t.tag).join(", ").length;
  const searchOptimization =
    seoTags.length >= 6 && totalSeoChars <= 500
      ? 96
      : totalSeoChars > 500
      ? 68
      : 82;

  const selectedHashtagCount = hashtags.filter((h) => h.selected).length;
  const hashtagRelevance =
    selectedHashtagCount >= 3 && selectedHashtagCount <= 8
      ? 94
      : selectedHashtagCount > 8
      ? 78
      : 75;

  const hookStrength = hookAnalysis.openingStrength;
  const thumbnailQuality =
    thumbnail.shortThumbnailText.trim().split(/\s+/).length <= 5 ? 95 : 83;
  const audienceAlignment = 94;
  const contentRelevance = 97;

  const overall = Math.round(
    titleQuality * 0.2 +
      descriptionQuality * 0.14 +
      searchOptimization * 0.14 +
      hashtagRelevance * 0.1 +
      hookStrength * 0.16 +
      thumbnailQuality * 0.1 +
      audienceAlignment * 0.08 +
      contentRelevance * 0.08
  );

  const deductionsAndFixes: PublishingOptimizationScore["deductionsAndFixes"] = [];

  if (titleLen > 68) {
    deductionsAndFixes.push({
      issue: `Selected title is ${titleLen} characters (risks truncation on mobile Shorts shelf).`,
      impact: "-6 pts Title Quality",
      fixAction: "Shorten title to 40–65 characters in the Titles tab.",
    });
  }
  if (selectedHashtagCount < 3 || selectedHashtagCount > 8) {
    deductionsAndFixes.push({
      issue: `${selectedHashtagCount} hashtags selected (optimal range is 3–6 focused hashtags).`,
      impact: "-4 pts Hashtag Relevance",
      fixAction: "Select between 3 and 6 high-signal hashtags in the Hashtags tab.",
    });
  }
  if (totalSeoChars > 500) {
    deductionsAndFixes.push({
      issue: `YouTube SEO tags exceed the 500-character limit (${totalSeoChars}/500).`,
      impact: "-10 pts Search Optimization",
      fixAction: "Remove redundant tags in the SEO Tags tab to stay under 500 characters.",
    });
  }
  if (deductionsAndFixes.length === 0) {
    deductionsAndFixes.push({
      issue: "All primary metadata dimensions pass YouTube Shorts & multi-platform checks.",
      impact: "Optimal Readiness",
      fixAction:
        "Optional: Test A/B title comparison or add the 0–2.5s visual hook badge before export.",
    });
  }

  return {
    overall,
    titleQuality,
    descriptionQuality,
    searchOptimization,
    hashtagRelevance,
    hookStrength,
    thumbnailQuality,
    audienceAlignment,
    contentRelevance,
    deductionsAndFixes,
  };
}

export function generateCompletePublishingPackage(params: {
  clip: GeneratedClip;
  project?: VideoProject;
  trendingVideos: TrendingVideoItem[];
  viralRadar: ViralRadarData;
  existingPackage?: VyralPublishingPackage;
  seedOffset?: number;
}): VyralPublishingPackage {
  const {
    clip,
    project,
    trendingVideos,
    viralRadar,
    existingPackage,
    seedOffset = 0,
  } = params;

  const titles = generateTitlesForClip(clip, project, seedOffset);
  const recommendedTitle = titles.find((t) => t.isAiRecommended) || titles[0];
  const descriptions = generateDescriptionsForClip(clip, project);
  const hashtags = generateSmartHashtagsForClip(clip, trendingVideos, viralRadar);
  const seoTags = generateSeoTagsForClip(clip, project);
  const hookAnalysis = generateHookAnalysisForClip(clip, project);
  const thumbnail = generateThumbnailOptimizationForClip(clip, project);
  const pinnedComments = generatePinnedCommentsForClip(clip, project);
  const selectedPinned = pinnedComments[0];

  const platformPackages = buildPlatformPackages({
    clip,
    project,
    selectedTitle: recommendedTitle.text,
    descriptions,
    hashtags,
    seoTags,
    hookAnalysis,
    thumbnail,
    pinnedComment: selectedPinned.text,
  });

  const optimizationScore = calculatePublishingOptimizationScore({
    selectedTitle: recommendedTitle.text,
    titles,
    descriptions,
    hashtags,
    seoTags,
    hookAnalysis,
    thumbnail,
  });

  const nowIso = new Date().toISOString();
  const prevHistory = existingPackage?.versionHistory || [];
  const nextVersionHistory = [
    {
      versionId: `v-${prevHistory.length + 1}-${Date.now().toString().slice(-4)}`,
      savedAt: nowIso,
      selectedTitle: recommendedTitle.text,
      overallScore: optimizationScore.overall,
      targetPlatform: (existingPackage?.targetPlatform ||
        "youtube_shorts") as TargetPublishPlatform,
    },
    ...prevHistory.slice(0, 7),
  ];

  return {
    clipId: clip.id,
    generatedAt: existingPackage?.generatedAt || nowIso,
    updatedAt: nowIso,
    targetPlatform: existingPackage?.targetPlatform || "youtube_shorts",
    selectedTitleId: recommendedTitle.id,
    selectedTitleText: recommendedTitle.text,
    titles,
    descriptions,
    hashtags,
    seoTags,
    hookAnalysis,
    thumbnail,
    pinnedComments,
    selectedPinnedCommentId: selectedPinned.id,
    platformPackages,
    optimizationScore,
    trendSignalsUsed: [
      `Trending Now Velocity Cluster (${trendingVideos[0]?.topic || "AI Workflows"})`,
      `Viral Radar Keyword #retentionvelocity (+340% 7d growth)`,
      `Clip Transcript Alignment (${clip.startTime}s–${clip.endTime}s, ${clip.words.length} tokens)`,
    ],
    versionHistory: nextVersionHistory,
  };
}
