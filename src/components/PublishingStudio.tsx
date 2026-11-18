"use client";

import React, { useState } from "react";
import {
  Sparkles,
  FileText,
  Hash,
  Tags,
  Zap,
  Image as ImageIcon,
  MessageSquarePlus,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  Download,
  Scissors,
} from "lucide-react";
import {
  DatabaseSchema,
  GeneratedClip,
  TargetPublishPlatform,
  VideoProject,
  VyralPublishingPackage,
  WinningTitleRecord,
} from "@/lib/types";
import { generateCompletePublishingPackage } from "@/lib/publishing-optimizer";

interface PublishingStudioProps {
  clips: GeneratedClip[];
  projects: VideoProject[];
  activeClip: GeneratedClip;
  winningTitles?: WinningTitleRecord[];
  onSelectClip: (clip: GeneratedClip) => void;
  onPackageUpdated: (clip: GeneratedClip, db: DatabaseSchema) => void;
  onOpenSubtitleStudio: (clip: GeneratedClip) => void;
  onOpenExportModal: (clip: GeneratedClip) => void;
}

type StudioSectionId =
  | "titles"
  | "description"
  | "hashtags"
  | "seo-tags"
  | "hooks"
  | "thumbnail"
  | "pinned-comments"
  | "platform-preview";

const STUDIO_TABS: {
  id: StudioSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "titles", label: "Titles", icon: Sparkles },
  { id: "description", label: "Description", icon: FileText },
  { id: "hashtags", label: "Hashtags", icon: Hash },
  { id: "seo-tags", label: "SEO Tags", icon: Tags },
  { id: "hooks", label: "Hooks", icon: Zap },
  { id: "thumbnail", label: "Thumbnail", icon: ImageIcon },
  { id: "pinned-comments", label: "Pinned Comments", icon: MessageSquarePlus },
  { id: "platform-preview", label: "Platform Preview", icon: Smartphone },
];

export function PublishingStudio({
  clips,
  projects,
  activeClip,
  onSelectClip,
  onPackageUpdated,
  onOpenSubtitleStudio,
  onOpenExportModal,
}: PublishingStudioProps) {
  const activeProject = projects.find((p) => p.id === activeClip.projectId);

  const [pkg, setPkg] = useState<VyralPublishingPackage>(() => {
    if (activeClip.publishingPackage) return activeClip.publishingPackage;
    return generateCompletePublishingPackage({
      clip: activeClip,
      project: activeProject,
      trendingVideos: [],
      viralRadar: {
        emergingTopics: [],
        risingCreators: [],
        podcastMoments: [],
        trendingKeywords: [],
      },
    });
  });

  const [activeSection, setActiveSection] =
    useState<StudioSectionId>("titles");
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customHashtagInput, setCustomHashtagInput] = useState("");
  const [customSeoTagInput, setCustomSeoTagInput] = useState("");

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const persistPackage = async (nextPkg: VyralPublishingPackage = pkg) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId: activeClip.id,
          action: "save",
          publishingPackage: nextPkg,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPkg(data.clip.publishingPackage);
        onPackageUpdated(data.clip, data.db);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateAll = async (
    platform: TargetPublishPlatform = pkg.targetPlatform
  ) => {
    setIsRegenerating(true);
    try {
      const res = await fetch("/api/optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId: activeClip.id,
          action: "regenerate",
          targetPlatform: platform,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPkg(data.clip.publishingPackage);
        onPackageUpdated(data.clip, data.db);
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSelectTitle = (titleId: string, titleText: string) => {
    const nextPkg: VyralPublishingPackage = {
      ...pkg,
      selectedTitleId: titleId,
      selectedTitleText: titleText,
    };
    setPkg(nextPkg);
    persistPackage(nextPkg);
  };

  const handleToggleHashtag = (tag: string) => {
    const updated = pkg.hashtags.map((h) =>
      h.tag === tag ? { ...h, selected: !h.selected } : h
    );
    const nextPkg = { ...pkg, hashtags: updated };
    setPkg(nextPkg);
  };

  const handleAddCustomHashtag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHashtagInput.trim()) return;
    const formatted = customHashtagInput.trim().startsWith("#")
      ? customHashtagInput.trim()
      : `#${customHashtagInput.trim().replace(/\s+/g, "")}`;
    const nextPkg: VyralPublishingPackage = {
      ...pkg,
      hashtags: [
        ...pkg.hashtags,
        {
          tag: formatted,
          category: "Specific Topic",
          selected: true,
          reason: "Creator custom hashtag",
          isVerifiedTrending: false,
        },
      ],
    };
    setPkg(nextPkg);
    setCustomHashtagInput("");
  };

  const handleAddSeoTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSeoTagInput.trim()) return;
    const nextPkg: VyralPublishingPackage = {
      ...pkg,
      seoTags: [
        ...pkg.seoTags,
        {
          id: `seo-custom-${Date.now()}`,
          tag: customSeoTagInput.trim(),
          category: "Primary Keywords",
          searchIntent: "High-Intent",
        },
      ],
    };
    setPkg(nextPkg);
    setCustomSeoTagInput("");
  };

  const selectedHashtagsString = pkg.hashtags
    .filter((h) => h.selected)
    .map((h) => h.tag)
    .join(" ");

  const allSeoTagsCsv = pkg.seoTags.map((t) => t.tag).join(", ");

  const activeDescriptionText =
    pkg.descriptions[pkg.descriptions.selectedVariation];

  const activePinnedComment =
    pkg.pinnedComments.find((p) => p.id === pkg.selectedPinnedCommentId) ||
    pkg.pinnedComments[0];

  const fullCopyBundle = `${pkg.selectedTitleText}\n\n${activeDescriptionText}\n\n${selectedHashtagsString}\n\nTags: ${allSeoTagsCsv}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Top Workspace Header */}
      <div className="bg-white border border-[#E9ECF2] rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#F2EEFF] text-[#7655E9] text-xs font-medium">
              Publishing Studio
            </span>
            <span className="text-xs text-[#159B75] font-medium">
              Readiness {pkg.optimizationScore.overall}%
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#171923]">
            Prepare your clip for release
          </h1>
          <p className="text-xs text-[#737B8C]">
            AI-tailored titles, descriptions, hashtags, hooks, and platform
            previews grounded in your video transcript.
          </p>
        </div>

        {/* Clip Selector & Primary Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={activeClip.id}
            onChange={(e) => {
              const found = clips.find((c) => c.id === e.target.value);
              if (found) onSelectClip(found);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923] font-medium max-w-[230px] truncate"
          >
            {clips.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleRegenerateAll(pkg.targetPlatform)}
            disabled={isRegenerating}
            className="px-3.5 py-2 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#737B8C] ${
                isRegenerating ? "animate-spin" : ""
              }`}
            />
            <span>Regenerate</span>
          </button>

          <button
            onClick={() => persistPackage(pkg)}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-[#159B75]" />
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </button>

          <button
            onClick={() => copyText(fullCopyBundle, "copy-all")}
            className="px-4 py-2 rounded-xl bg-[#7655E9] hover:bg-[#6544DC] text-xs font-medium text-white flex items-center gap-1.5 shadow-sm shadow-[#7655E9]/20 cursor-pointer"
          >
            {copiedId === "copy-all" ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied Package</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Package</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Clean Horizontal Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STUDIO_TABS.map((tab) => {
          const Icon = tab.icon;
          const isAct = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                isAct
                  ? "bg-[#F2EEFF] text-[#7655E9]"
                  : "bg-white border border-[#E9ECF2] text-[#737B8C] hover:text-[#171923]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Layout: Left Active Clip Card (4 Cols) + Right Content Workspace (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Summary Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-[#E9ECF2] rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="aspect-[16/10] rounded-xl overflow-hidden bg-[#0F1117] relative">
              <video
                src={activeClip.renderedVideoUrl || activeClip.sourceVideoUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-[#7655E9] uppercase tracking-wider">
                Selected Title
              </div>
              <div className="text-sm font-semibold text-[#171923] leading-snug">
                {pkg.selectedTitleText}
              </div>
              <div className="text-xs text-[#737B8C]">
                {activeClip.duration}s • {activeClip.aspectRatio} •{" "}
                {activeClip.resolution}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E9ECF2] grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenSubtitleStudio(activeClip)}
                className="py-2 px-3 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5 text-[#737B8C]" />
                <span>Edit Video</span>
              </button>
              <button
                onClick={() => onOpenExportModal(activeClip)}
                className="py-2 px-3 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#737B8C]" />
                <span>Export MP4</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Active Section Surface */}
        <div className="lg:col-span-8 bg-white border border-[#E9ECF2] rounded-2xl p-6 shadow-xs">
          {/* 1. TITLES */}
          {activeSection === "titles" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#171923]">
                    Viral Title Recommendations
                  </h2>
                  <p className="text-xs text-[#737B8C]">
                    Select a title or edit your active headline directly below.
                  </p>
                </div>
              </div>

              {/* Editable Active Title */}
              <div className="p-4 rounded-xl bg-[#F2EEFF]/50 border border-[#D8D0F8] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#7655E9]">
                    Active Title
                  </span>
                  <button
                    onClick={() =>
                      copyText(pkg.selectedTitleText, "active-title")
                    }
                    className="text-xs font-medium text-[#7655E9] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === "active-title" ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={pkg.selectedTitleText}
                  onChange={(e) =>
                    setPkg({ ...pkg, selectedTitleText: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E9ECF2] focus:border-[#7655E9] focus:outline-none text-sm font-medium text-[#171923]"
                />
              </div>

              {/* 10 Title Variations */}
              <div className="space-y-2.5">
                {pkg.titles.map((t) => {
                  const isSelected = pkg.selectedTitleId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTitle(t.id, t.text)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                        isSelected
                          ? "bg-[#F2EEFF]/40 border-[#7655E9]"
                          : "bg-[#FAFBFD] border-[#E9ECF2] hover:border-[#D8D0F8]"
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-[#737B8C]">
                            {t.style}
                          </span>
                          {t.isAiRecommended && (
                            <span className="px-2 py-0.5 rounded-md bg-[#F2EEFF] text-[#7655E9] text-[10px] font-medium">
                              AI Recommended
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-[#171923]">
                          {t.text}
                        </div>
                        <p className="text-xs text-[#737B8C]">{t.explanation}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyText(t.text, t.id);
                          }}
                          className="p-2 rounded-lg bg-white border border-[#E9ECF2] text-[#737B8C] hover:text-[#171923] cursor-pointer"
                        >
                          {copiedId === t.id ? (
                            <Check className="w-3.5 h-3.5 text-[#159B75]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. DESCRIPTION */}
          {activeSection === "description" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[#171923]">
                    Description & Caption
                  </h2>
                  <p className="text-xs text-[#737B8C]">
                    Switch between short punchy captions, full SEO descriptions,
                    or conversational notes.
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2]">
                  {(
                    [
                      { id: "shortAndPunchy", label: "Short" },
                      { id: "seoOptimized", label: "SEO Full" },
                      { id: "conversational", label: "Conversational" },
                    ] as const
                  ).map((v) => (
                    <button
                      key={v.id}
                      onClick={() =>
                        setPkg({
                          ...pkg,
                          descriptions: {
                            ...pkg.descriptions,
                            selectedVariation: v.id,
                          },
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        pkg.descriptions.selectedVariation === v.id
                          ? "bg-white text-[#7655E9] shadow-xs"
                          : "text-[#737B8C] hover:text-[#171923]"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={10}
                value={activeDescriptionText}
                onChange={(e) =>
                  setPkg({
                    ...pkg,
                    descriptions: {
                      ...pkg.descriptions,
                      [pkg.descriptions.selectedVariation]: e.target.value,
                    },
                  })
                }
                className="w-full p-4 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] focus:bg-white focus:border-[#7655E9] focus:outline-none text-xs text-[#171923] leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  onClick={() => copyText(activeDescriptionText, "desc-copy")}
                  className="px-4 py-2 rounded-xl bg-[#F2EEFF] hover:bg-[#E5DCFF] text-xs font-medium text-[#7655E9] flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === "desc-copy" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied Description</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Description</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 3. HASHTAGS */}
          {activeSection === "hashtags" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#171923]">
                    Smart Hashtags
                  </h2>
                  <p className="text-xs text-[#737B8C]">
                    Click tags to include or exclude them from your release kit.
                  </p>
                </div>
                <button
                  onClick={() => copyText(selectedHashtagsString, "copy-tags")}
                  className="px-3.5 py-2 rounded-xl bg-[#F2EEFF] text-[#7655E9] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === "copy-tags" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Selected</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {pkg.hashtags.map((h) => (
                  <button
                    key={h.tag}
                    onClick={() => handleToggleHashtag(h.tag)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      h.selected
                        ? "bg-[#F2EEFF] border-[#7655E9] text-[#7655E9]"
                        : "bg-[#FAFBFD] border-[#E9ECF2] text-[#737B8C]"
                    }`}
                  >
                    {h.tag}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAddCustomHashtag} className="flex gap-2">
                <input
                  type="text"
                  value={customHashtagInput}
                  onChange={(e) => setCustomHashtagInput(e.target.value)}
                  placeholder="Add custom hashtag..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#171923] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          )}

          {/* 4. SEO TAGS */}
          {activeSection === "seo-tags" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-[#171923]">
                    Search Keywords & SEO Tags
                  </h2>
                  <p className="text-xs text-[#737B8C]">
                    Comma-separated search phrases for YouTube Studio & TikTok
                    SEO.
                  </p>
                </div>
                <button
                  onClick={() => copyText(allSeoTagsCsv, "copy-seo")}
                  className="px-3.5 py-2 rounded-xl bg-[#F2EEFF] text-[#7655E9] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === "copy-seo" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied CSV</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy All as CSV</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {pkg.seoTags.map((item) => (
                  <span
                    key={item.id}
                    className="px-3 py-1.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923] flex items-center gap-2"
                  >
                    <span>{item.tag}</span>
                    <button
                      onClick={() =>
                        setPkg({
                          ...pkg,
                          seoTags: pkg.seoTags.filter((x) => x.id !== item.id),
                        })
                      }
                      className="text-[#9CA3AF] hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddSeoTag} className="flex gap-2">
                <input
                  type="text"
                  value={customSeoTagInput}
                  onChange={(e) => setCustomSeoTagInput(e.target.value)}
                  placeholder="Add search keyword..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#171923] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Keyword</span>
                </button>
              </form>
            </div>
          )}

          {/* 5. HOOKS */}
          {activeSection === "hooks" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-[#171923]">
                  Opening Hook Optimizer
                </h2>
                <p className="text-xs text-[#737B8C]">
                  Strengthen the first 3 seconds with an on-screen text hook or
                  spoken lead-in.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] space-y-1.5">
                <div className="text-xs font-medium text-[#737B8C]">
                  Original Opening Line
                </div>
                <p className="text-sm text-[#171923] italic">
                  &ldquo;{pkg.hookAnalysis.originalOpeningTranscript}&rdquo;
                </p>
                <p className="text-xs text-[#737B8C] pt-1">
                  {pkg.hookAnalysis.diagnosticSummary}
                </p>
              </div>

              <div className="space-y-2.5">
                {pkg.hookAnalysis.alternativeHooks.map((alt) => {
                  const isSelected =
                    pkg.hookAnalysis.activeOpeningTextHook === alt.overlayText;
                  return (
                    <div
                      key={alt.id}
                      onClick={() =>
                        setPkg({
                          ...pkg,
                          hookAnalysis: {
                            ...pkg.hookAnalysis,
                            activeOpeningTextHook: alt.overlayText,
                          },
                        })
                      }
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? "bg-[#F2EEFF]/50 border-[#7655E9]"
                          : "bg-[#FAFBFD] border-[#E9ECF2] hover:border-[#D8D0F8]"
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-[#7655E9]">
                          {alt.angle}
                        </span>
                        <div className="text-sm font-medium text-[#171923]">
                          {alt.overlayText}
                        </div>
                        <p className="text-xs text-[#737B8C]">
                          {alt.spokenLeadNote}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-[#159B75] shrink-0">
                        {alt.projectedLift}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. THUMBNAIL */}
          {activeSection === "thumbnail" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-[#171923]">
                  Thumbnail & Cover Text
                </h2>
                <p className="text-xs text-[#737B8C]">
                  Configure high-contrast cover text or upload a custom
                  thumbnail frame.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-[#737B8C]">
                  Cover Text Overlay
                </label>
                <input
                  type="text"
                  value={pkg.thumbnail.shortThumbnailText}
                  onChange={(e) =>
                    setPkg({
                      ...pkg,
                      thumbnail: {
                        ...pkg.thumbnail,
                        shortThumbnailText: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-sm font-medium text-[#171923]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {pkg.thumbnail.frameCandidates.map((frame) => (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() =>
                      setPkg({
                        ...pkg,
                        thumbnail: {
                          ...pkg.thumbnail,
                          recommendedTimestamp: frame.timestamp,
                        },
                      })
                    }
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                      pkg.thumbnail.recommendedTimestamp === frame.timestamp
                        ? "bg-[#F2EEFF]/50 border-[#7655E9]"
                        : "bg-[#FAFBFD] border-[#E9ECF2]"
                    }`}
                  >
                    <div className="text-xs font-semibold text-[#171923]">
                      Frame @ {frame.timestamp}s
                    </div>
                    <p className="text-xs text-[#737B8C]">
                      {frame.visualDescription}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 7. PINNED COMMENTS */}
          {activeSection === "pinned-comments" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[#171923]">
                  Pinned Comment Suggestions
                </h2>
                <p className="text-xs text-[#737B8C]">
                  Spark early viewer replies in the first 30 minutes after
                  publishing.
                </p>
              </div>

              <div className="space-y-2.5">
                {pkg.pinnedComments.map((pc) => {
                  const isSelected = pkg.selectedPinnedCommentId === pc.id;
                  return (
                    <div
                      key={pc.id}
                      onClick={() =>
                        setPkg({ ...pkg, selectedPinnedCommentId: pc.id })
                      }
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                        isSelected
                          ? "bg-[#F2EEFF]/50 border-[#7655E9]"
                          : "bg-[#FAFBFD] border-[#E9ECF2]"
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-[11px] font-medium text-[#7655E9]">
                          {pc.style}
                        </span>
                        <p className="text-sm text-[#171923]">{pc.text}</p>
                        <p className="text-xs text-[#737B8C]">{pc.rationale}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyText(pc.text, pc.id);
                        }}
                        className="p-2 rounded-lg bg-white border border-[#E9ECF2] text-[#737B8C] hover:text-[#171923] cursor-pointer"
                      >
                        {copiedId === pc.id ? (
                          <Check className="w-3.5 h-3.5 text-[#159B75]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 8. PLATFORM PREVIEW */}
          {activeSection === "platform-preview" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-[#171923]">
                    Platform Preview
                  </h2>
                  <p className="text-xs text-[#737B8C]">
                    Preview how your metadata package renders across each
                    destination.
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2]">
                  {(
                    [
                      { id: "youtube_shorts", label: "Shorts" },
                      { id: "instagram_reels", label: "Reels" },
                      { id: "tiktok", label: "TikTok" },
                      { id: "youtube_longform", label: "Long-Form" },
                    ] as { id: TargetPublishPlatform; label: string }[]
                  ).map((p) => (
                    <button
                      key={p.id}
                      onClick={() =>
                        setPkg({ ...pkg, targetPlatform: p.id })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                        pkg.targetPlatform === p.id
                          ? "bg-white text-[#7655E9] shadow-xs"
                          : "text-[#737B8C] hover:text-[#171923]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAFBFD] border border-[#E9ECF2] space-y-3">
                <div className="text-xs font-medium text-[#7655E9] uppercase tracking-wider">
                  {pkg.targetPlatform.replace("_", " ")} Package
                </div>
                <h3 className="text-base font-semibold text-[#171923]">
                  {pkg.selectedTitleText}
                </h3>
                <p className="text-xs text-[#737B8C] whitespace-pre-line leading-relaxed">
                  {activeDescriptionText}
                </p>
                <div className="text-xs text-[#7655E9] font-medium">
                  {selectedHashtagsString}
                </div>
                {activePinnedComment && (
                  <div className="pt-3 border-t border-[#E9ECF2] text-xs text-[#737B8C]">
                    <strong className="text-[#171923]">Pinned Comment:</strong>{" "}
                    {activePinnedComment.text}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
