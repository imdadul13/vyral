"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Upload,
  SlidersHorizontal,
  Check,
  AlertCircle,
  Loader2,
  Play,
  Scissors,
  Rocket,
  ChevronDown,
  ChevronUp,
  Link2,
} from "lucide-react";
import {
  AspectRatio,
  ClipGenerationConfig,
  DatabaseSchema,
  FrameRate,
  GeneratedClip,
  SubtitlePresetId,
  VideoProject,
  VideoResolution,
} from "@/lib/types";
import { SUBTITLE_PRESETS, SUPPORTED_LANGUAGES } from "@/lib/presets";

interface CreateClipsViewProps {
  initialUrl?: string;
  onAnalysisComplete: (data: {
    project: VideoProject;
    clips: GeneratedClip[];
    db: DatabaseSchema;
  }) => void;
  onOpenClipInStudio: (clip: GeneratedClip) => void;
  onOpenPublishingStudio: (clip: GeneratedClip) => void;
  onOpenExportModal: (clip: GeneratedClip) => void;
}

const PIPELINE_STAGES = [
  { id: "ingest", label: "Video ingestion", detail: "Validating media source & retrieving metadata" },
  { id: "transcribe", label: "Transcription", detail: "Aligning word-by-word speech timestamps" },
  { id: "analyze", label: "AI analysis", detail: "Scoring narrative arc, pacing & emotional shifts" },
  { id: "moments", label: "Moment detection", detail: "Extracting self-contained viral hooks" },
  { id: "clips", label: "Clip generation", detail: "Framing active speaker & applying kinetic captions" },
  { id: "render", label: "Rendering", detail: "Preparing studio-ready short-form packages" },
];

export function CreateClipsView({
  initialUrl,
  onAnalysisComplete,
  onOpenClipInStudio,
  onOpenPublishingStudio,
  onOpenExportModal,
}: CreateClipsViewProps) {
  const [youtubeUrl, setYoutubeUrl] = useState(
    initialUrl || "https://www.youtube.com/watch?v=M7lc1UVf-VE"
  );
  const [showPreferences, setShowPreferences] = useState(false);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);

  const [config, setConfig] = useState<ClipGenerationConfig>({
    clipCount: 5,
    targetDuration: 30,
    aspectRatio: "9:16",
    resolution: "1080p",
    fps: 60,
    language: "en",
    subtitlePresetId: "hormozi-bold",
    speakerTracking: true,
    autoReframing: true,
    backgroundEnhancement: true,
    ownershipConfirmed: true,
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [latestProject, setLatestProject] = useState<VideoProject | null>(null);
  const [generatedClips, setGeneratedClips] = useState<GeneratedClip[]>([]);

  const handleAnalyzeAndGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsAnalyzing(true);
    setStepIndex(0);

    const interval = setInterval(() => {
      setStepIndex((prev) => Math.min(PIPELINE_STAGES.length - 1, prev + 1));
    }, 380);

    try {
      const res = await fetch("/api/youtube/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl, config }),
      });
      const data = await res.json();
      clearInterval(interval);

      if (!res.ok) {
        setError(data.error || "Unable to analyze video URL");
        setIsAnalyzing(false);
        return;
      }

      setLatestProject(data.project);
      setGeneratedClips(data.clips);
      onAnalysisComplete(data);
    } catch (err) {
      clearInterval(interval);
      setError(
        err instanceof Error ? err.message : "Network error while analyzing video"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Editorial Header */}
      <div className="text-center max-w-2xl mx-auto pt-4 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F2EEFF] text-[#7655E9] text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Clip Generator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#171923]">
          Turn long videos into moments worth sharing.
        </h1>
        <p className="text-sm sm:text-base text-[#737B8C]">
          Paste a YouTube link or upload an authorized video file. VYRAL identifies
          the strongest hooks, frames the speaker, and builds your publishing kit.
        </p>
      </div>

      {/* Clean Main Input Surface */}
      <form
        onSubmit={handleAnalyzeAndGenerate}
        className="bg-white border border-[#E9ECF2] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 text-[#9CA3AF] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Paste a YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] focus:bg-white focus:border-[#7655E9] focus:outline-none text-sm text-[#171923] placeholder:text-[#9CA3AF] transition-all"
            />
          </div>

          <label className="px-4 py-3.5 rounded-xl bg-[#FAFBFD] hover:bg-[#F2EEFF]/60 border border-[#E9ECF2] text-[#171923] text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0">
            <Upload className="w-4 h-4 text-[#737B8C]" />
            <span>Upload video</span>
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setYoutubeUrl(
                    `https://www.youtube.com/watch?v=M7lc1UVf-VE&local=${encodeURIComponent(
                      file.name
                    )}`
                  );
                }
              }}
            />
          </label>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="px-7 py-3.5 rounded-xl bg-[#7655E9] hover:bg-[#6544DC] disabled:opacity-60 text-white text-sm font-medium shadow-sm shadow-[#7655E9]/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze video</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Pills & Preferences Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#E9ECF2]">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#737B8C]">
            <span>Sample videos:</span>
            <button
              type="button"
              onClick={() =>
                setYoutubeUrl("https://www.youtube.com/watch?v=M7lc1UVf-VE")
              }
              className="px-2.5 py-1 rounded-lg bg-[#FAFBFD] hover:bg-[#F2EEFF] hover:text-[#7655E9] border border-[#E9ECF2] transition-colors cursor-pointer"
            >
              Creator Keynote
            </button>
            <button
              type="button"
              onClick={() =>
                setYoutubeUrl("https://www.youtube.com/watch?v=aqz-KE-bpKQ")
              }
              className="px-2.5 py-1 rounded-lg bg-[#FAFBFD] hover:bg-[#F2EEFF] hover:text-[#7655E9] border border-[#E9ECF2] transition-colors cursor-pointer"
            >
              Founder Podcast
            </button>
            <span className="text-[#9CA3AF] hidden sm:inline">•</span>
            <span className="text-[#737B8C] hidden sm:inline">
              {config.clipCount} clips • {config.targetDuration}s • {config.aspectRatio} •{" "}
              {config.resolution}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowPreferences((prev) => !prev)}
            className="text-xs font-medium text-[#7655E9] hover:text-[#5E3FD6] flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Clip settings</span>
            {showPreferences ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Collapsible Clip Settings Panel */}
        <AnimatePresence>
          {showPreferences && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-[#E9ECF2] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Clip Count */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Number of clips
                  </label>
                  <div className="flex items-center gap-1.5">
                    {([3, 5, 10, 15] as const).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setConfig({ ...config, clipCount: cnt })}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                          config.clipCount === cnt
                            ? "bg-[#F2EEFF] border-[#7655E9] text-[#7655E9]"
                            : "bg-[#FAFBFD] border-[#E9ECF2] text-[#737B8C] hover:text-[#171923]"
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clip Duration */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Preferred duration
                  </label>
                  <div className="flex items-center gap-1.5">
                    {([15, 30, 45, 60, 90] as const).map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() =>
                          setConfig({ ...config, targetDuration: dur })
                        }
                        className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                          config.targetDuration === dur
                            ? "bg-[#F2EEFF] border-[#7655E9] text-[#7655E9]"
                            : "bg-[#FAFBFD] border-[#E9ECF2] text-[#737B8C] hover:text-[#171923]"
                        }`}
                      >
                        {dur}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Aspect ratio
                  </label>
                  <div className="flex items-center gap-1.5">
                    {(["9:16", "16:9", "1:1", "4:5"] as AspectRatio[]).map(
                      (ar) => (
                        <button
                          key={ar}
                          type="button"
                          onClick={() =>
                            setConfig({ ...config, aspectRatio: ar })
                          }
                          className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                            config.aspectRatio === ar
                              ? "bg-[#F2EEFF] border-[#7655E9] text-[#7655E9]"
                              : "bg-[#FAFBFD] border-[#E9ECF2] text-[#737B8C] hover:text-[#171923]"
                          }`}
                        >
                          {ar}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Resolution & Frame Rate */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Export resolution & FPS
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={config.resolution}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          resolution: e.target.value as VideoResolution,
                        })
                      }
                      className="px-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                    >
                      {(["720p", "1080p", "1440p", "4K"] as VideoResolution[]).map(
                        (r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        )
                      )}
                    </select>
                    <select
                      value={config.fps}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          fps: Number(e.target.value) as FrameRate,
                        })
                      }
                      className="px-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                    >
                      {([24, 25, 30, 50, 60] as FrameRate[]).map((f) => (
                        <option key={f} value={f}>
                          {f} FPS
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Caption language
                  </label>
                  <select
                    value={config.language}
                    onChange={(e) =>
                      setConfig({ ...config, language: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Default Subtitle Preset */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Subtitle style
                  </label>
                  <select
                    value={config.subtitlePresetId}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        subtitlePresetId: e.target.value as SubtitlePresetId,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                  >
                    {SUBTITLE_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sophisticated 6-Stage Processing Experience */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-6 rounded-2xl bg-[#FAFBFD] border border-[#E9ECF2] space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-[#171923]">
                    {PIPELINE_STAGES[stepIndex].label}
                  </div>
                  <div className="text-xs text-[#737B8C]">
                    {PIPELINE_STAGES[stepIndex].detail}
                  </div>
                </div>
                <span className="text-xs font-medium text-[#7655E9]">
                  {Math.round(((stepIndex + 1) / PIPELINE_STAGES.length) * 100)}%
                </span>
              </div>

              {/* Clean Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-[#E9ECF2] overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#7655E9] to-[#4B9DF8]"
                  initial={{ width: "12%" }}
                  animate={{
                    width: `${((stepIndex + 1) / PIPELINE_STAGES.length) * 100}%`,
                  }}
                />
              </div>

              {/* 6-Stage Stepper Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
                {PIPELINE_STAGES.map((stage, i) => {
                  const isDone = i < stepIndex;
                  const isCurrent = i === stepIndex;
                  return (
                    <div
                      key={stage.id}
                      className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 transition-colors ${
                        isCurrent
                          ? "bg-[#F2EEFF] border-[#7655E9]/40 text-[#7655E9] font-medium"
                          : isDone
                          ? "bg-white border-[#E9ECF2] text-[#159B75]"
                          : "bg-white/60 border-[#E9ECF2] text-[#9CA3AF]"
                      }`}
                    >
                      {isDone ? (
                        <Check className="w-3.5 h-3.5 shrink-0 text-[#159B75]" />
                      ) : isCurrent ? (
                        <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-[#7655E9]" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#E9ECF2]" />
                      )}
                      <span className="truncate">{stage.label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Generated Clips Gallery Output */}
      {generatedClips.length > 0 && latestProject && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Clean Project Summary Bar */}
          <div className="bg-white border border-[#E9ECF2] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={latestProject.thumbnailUrl}
                alt={latestProject.title}
                className="w-20 h-14 rounded-xl object-cover border border-[#E9ECF2]"
              />
              <div>
                <div className="text-xs font-medium text-[#159B75]">
                  {generatedClips.length} clips ready to review
                </div>
                <h2 className="text-base font-semibold text-[#171923]">
                  {latestProject.title}
                </h2>
                <p className="text-xs text-[#737B8C]">
                  {latestProject.channelName} • Average clip score:{" "}
                  {latestProject.avgViralScore}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedDetails((v) => !v)}
              className="text-xs font-medium text-[#737B8C] hover:text-[#171923] cursor-pointer self-start sm:self-auto"
            >
              {showAdvancedDetails
                ? "Hide technical details"
                : "Show AI selection notes"}
            </button>
          </div>

          {/* Visual Clip Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedClips.map((clip, idx) => (
              <motion.div
                key={clip.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -2 }}
                className="bg-white border border-[#E9ECF2] hover:border-[#D8D0F8] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs transition-all group"
              >
                <div>
                  {/* Large Thumbnail */}
                  <div className="relative aspect-[16/10] bg-[#F5F7FA] overflow-hidden">
                    <img
                      src={clip.thumbnailUrl}
                      alt={clip.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-white/95 text-xs font-medium text-[#171923]">
                        {clip.duration}s
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-white/95 text-xs font-medium text-[#737B8C]">
                        {clip.aspectRatio}
                      </span>
                    </div>
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-md bg-[#F2EEFF] text-[#7655E9] text-xs font-semibold">
                      Score {clip.viralScore}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-2.5">
                    <div className="text-xs font-medium text-[#7655E9]">
                      {clip.momentCategory}
                    </div>
                    <h3 className="text-base font-semibold text-[#171923] leading-snug line-clamp-2">
                      {clip.title}
                    </h3>
                    <p className="text-xs text-[#737B8C] line-clamp-2 leading-relaxed">
                      {clip.suggestedDescription}
                    </p>

                    {showAdvancedDetails && (
                      <div className="pt-2 mt-2 border-t border-[#E9ECF2] text-xs text-[#737B8C] space-y-1">
                        <div className="font-medium text-[#171923]">
                          Why AI selected this moment:
                        </div>
                        <p>{clip.aiReasoning}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clean 3-Action Bar: Preview, Edit, Publishing Studio */}
                <div className="px-5 pb-5 pt-3 border-t border-[#E9ECF2]/70 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenExportModal(clip)}
                    className="px-3 py-2 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-[#737B8C]" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenClipInStudio(clip)}
                    className="px-3 py-2 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Scissors className="w-3.5 h-3.5 text-[#737B8C]" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenPublishingStudio(clip)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#F2EEFF] hover:bg-[#E5DCFF] text-xs font-medium text-[#7655E9] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Publishing Studio</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
