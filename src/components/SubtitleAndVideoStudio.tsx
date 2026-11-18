"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Sparkles,
  Volume2,
  UserCheck,
  Wand2,
  Check,
  Download,
  Loader2,
  Languages,
  Type,
  Music,
  Shield,
  Rocket,
} from "lucide-react";
import {
  DatabaseSchema,
  GeneratedClip,
  SmartEditorSettings,
  SubtitlePresetId,
  SubtitleStyleConfig,
  WordTimestamp,
} from "@/lib/types";
import {
  getPresetConfig,
  LICENSED_MUSIC_TRACKS,
  SUBTITLE_PRESETS,
  SUPPORTED_LANGUAGES,
} from "@/lib/presets";

interface SubtitleAndVideoStudioProps {
  studioMode?: "clip-intelligence" | "subtitle-studio" | "video-editor";
  clips: GeneratedClip[];
  activeClip: GeneratedClip;
  onSelectClip: (clip: GeneratedClip) => void;
  onClipUpdated: (clip: GeneratedClip, db: DatabaseSchema) => void;
  onOpenPublishingStudio: (clip: GeneratedClip) => void;
  onOpenExportModal: (clip: GeneratedClip) => void;
}

export function SubtitleAndVideoStudio({
  studioMode = "subtitle-studio",
  clips,
  activeClip,
  onSelectClip,
  onClipUpdated,
  onOpenPublishingStudio,
  onOpenExportModal,
}: SubtitleAndVideoStudioProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "presets" | "style" | "words" | "smart-edit"
  >(
    studioMode === "video-editor"
      ? "smart-edit"
      : studioMode === "clip-intelligence"
      ? "words"
      : "presets"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderFeedback, setRenderFeedback] = useState<string | null>(null);

  const [style, setStyle] = useState<SubtitleStyleConfig>(
    activeClip.subtitleStyle
  );
  const [words, setWords] = useState<WordTimestamp[]>(activeClip.words);
  const [editor, setEditor] = useState<SmartEditorSettings>(
    activeClip.editorSettings
  );
  const [trimStart, setTrimStart] = useState<number>(activeClip.startTime);
  const [trimEnd, setTrimEnd] = useState<number>(activeClip.endTime);

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const clipDuration = Math.max(4, trimEnd - trimStart);
    const rel = vid.currentTime % clipDuration;
    setCurrentTime(Number(rel.toFixed(2)));
  };

  const persistUpdates = async (
    nextStyle = style,
    nextWords = words,
    nextEditor = editor,
    nextStart = trimStart,
    nextEnd = trimEnd
  ) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_clip",
          clipId: activeClip.id,
          updates: {
            subtitleStyle: nextStyle,
            words: nextWords,
            editorSettings: nextEditor,
            startTime: nextStart,
            endTime: nextEnd,
            duration: Number(Math.max(4, nextEnd - nextStart).toFixed(1)),
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onClipUpdated(data.clip, data.db);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyPreset = (presetId: SubtitlePresetId) => {
    const nextConfig = getPresetConfig(presetId);
    setStyle(nextConfig);
    persistUpdates(nextConfig, words, editor, trimStart, trimEnd);
  };

  const handleWordTextChange = (wordId: string, newText: string) => {
    const updated = words.map((w) =>
      w.id === wordId ? { ...w, word: newText } : w
    );
    setWords(updated);
  };

  const handleServerRender = async () => {
    setIsRendering(true);
    setRenderFeedback(null);
    await persistUpdates();
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId: activeClip.id }),
      });
      const data = await res.json();
      if (res.ok) {
        onClipUpdated(data.clip, data.db);
        setRenderFeedback(
          `Rendered MP4 via FFmpeg (${data.probe.width}x${data.probe.height}, ${data.probe.sizeKb} KB in ${data.probe.renderTimeMs}ms)`
        );
      }
    } finally {
      setIsRendering(false);
    }
  };

  const effectiveWords = editor.removeFillerWords
    ? words.filter((w) => !w.isFiller)
    : words;

  const activeWordIndex = effectiveWords.findIndex(
    (w) => currentTime >= w.start && currentTime <= w.end + 0.25
  );
  const currentIdx = activeWordIndex === -1 ? 0 : activeWordIndex;
  const maxPerLine = Math.max(1, style.maxWordsPerLine || 3);
  const chunkStart = Math.floor(currentIdx / maxPerLine) * maxPerLine;
  const visibleChunk = effectiveWords.slice(
    chunkStart,
    chunkStart + maxPerLine
  );
  const activeSpeaker =
    visibleChunk.find((w) => w.id === effectiveWords[currentIdx]?.id)
      ?.speaker ||
    visibleChunk[0]?.speaker ||
    "Host";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Studio Top Bar */}
      <div className="bg-white border border-[#E9ECF2] rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-[#171923]">
              {studioMode === "video-editor"
                ? "Video Editor"
                : studioMode === "clip-intelligence"
                ? "Clip Intelligence & Transcript"
                : "Subtitle Studio"}
            </h1>
            <p className="text-xs text-[#737B8C]">
              Refine kinetic captions, speaker framing, and timeline cuts.
            </p>
          </div>

          <select
            value={activeClip.id}
            onChange={(e) => {
              const found = clips.find((c) => c.id === e.target.value);
              if (found) onSelectClip(found);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923] font-medium max-w-xs truncate focus:border-[#7655E9] focus:outline-none"
          >
            {clips.map((c) => (
              <option key={c.id} value={c.id}>
                [Score {c.viralScore}] {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => persistUpdates()}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center gap-1.5 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7655E9]" />
            ) : (
              <Check className="w-3.5 h-3.5 text-[#159B75]" />
            )}
            <span>Save</span>
          </button>

          <button
            onClick={handleServerRender}
            disabled={isRendering}
            className="px-4 py-2 rounded-xl bg-[#F2EEFF] hover:bg-[#E5DCFF] text-xs font-medium text-[#7655E9] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {isRendering ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Rendering...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>Render Subtitles</span>
              </>
            )}
          </button>

          <button
            onClick={() => onOpenPublishingStudio(activeClip)}
            className="px-4 py-2 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center gap-1.5 cursor-pointer"
          >
            <Rocket className="w-3.5 h-3.5 text-[#7655E9]" />
            <span>Publishing Studio</span>
          </button>

          <button
            onClick={() => onOpenExportModal(activeClip)}
            className="px-4 py-2 rounded-xl bg-[#7655E9] hover:bg-[#6544DC] text-xs font-medium text-white flex items-center gap-1.5 shadow-sm shadow-[#7655E9]/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {renderFeedback && (
        <div className="p-3.5 rounded-xl bg-[#E8F8F2] border border-[#159B75]/30 text-[#159B75] text-xs flex items-center justify-between">
          <span>✓ {renderFeedback}</span>
          {activeClip.renderedVideoUrl && (
            <a
              href={activeClip.renderedVideoUrl}
              download
              className="underline font-semibold"
            >
              Download Rendered MP4
            </a>
          )}
        </div>
      )}

      {/* Main Split Editor Canvas */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Light Neutral Video Canvas & Timeline (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl bg-white border border-[#E9ECF2] p-5 flex flex-col items-center space-y-4 shadow-xs">
            {/* Aspect Ratio & Speaker Indicator */}
            <div className="w-full flex items-center justify-between text-xs text-[#737B8C]">
              <span>
                {activeClip.aspectRatio} • {activeClip.resolution} •{" "}
                {activeClip.fps} FPS
              </span>
              {editor.activeSpeakerDetection && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8F2] text-[#159B75] flex items-center gap-1 text-[11px] font-medium">
                  <UserCheck className="w-3 h-3" />
                  <span>Speaker: {activeSpeaker}</span>
                </span>
              )}
            </div>

            {/* Light Neutral Studio Canvas */}
            <div className="w-full py-4 rounded-2xl bg-[#F5F7FA] border border-[#E9ECF2] flex items-center justify-center">
              <div
                className={`relative overflow-hidden rounded-2xl border border-[#E9ECF2] bg-[#0F1117] shadow-lg flex items-center justify-center ${
                  activeClip.aspectRatio === "9:16"
                    ? "w-[270px] h-[480px]"
                    : activeClip.aspectRatio === "1:1"
                    ? "w-[340px] h-[340px]"
                    : activeClip.aspectRatio === "4:5"
                    ? "w-[300px] h-[375px]"
                    : "w-full aspect-video"
                }`}
              >
                <video
                  ref={videoRef}
                  src={
                    activeClip.renderedVideoUrl || activeClip.sourceVideoUrl
                  }
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  loop
                  playsInline
                  style={{
                    transform: `scale(${editor.zoomScale}) translate(${editor.cropX}px, ${editor.cropY}px)`,
                  }}
                  className="w-full h-full object-cover transition-transform duration-200"
                />

                {/* Watermark Overlay */}
                {editor.watermarkEnabled && (
                  <div
                    style={{ opacity: editor.watermarkOpacity }}
                    className={`absolute px-2.5 py-1 rounded-md bg-black/45 backdrop-blur-xs text-[11px] font-mono font-medium text-white pointer-events-none ${
                      editor.watermarkPosition === "top-right"
                        ? "top-3 right-3"
                        : editor.watermarkPosition === "top-left"
                        ? "top-3 left-3"
                        : editor.watermarkPosition === "bottom-right"
                        ? "bottom-3 right-3"
                        : "bottom-3 left-3"
                    }`}
                  >
                    {editor.watermarkText}
                  </div>
                )}

                {/* Real-Time Animated Subtitle Overlay */}
                <div
                  style={{ top: `${style.positionY}%` }}
                  className="absolute left-3 right-3 -translate-y-1/2 flex flex-col items-center pointer-events-none z-20"
                >
                  {style.speakerIdentification && (
                    <span className="mb-1 px-2 py-0.5 rounded bg-[#7655E9] text-[10px] font-semibold text-white uppercase tracking-wider">
                      {activeSpeaker}
                    </span>
                  )}

                  <div
                    style={{
                      backgroundColor:
                        style.backgroundOpacity > 0
                          ? `rgba(15, 17, 23, ${style.backgroundOpacity})`
                          : "transparent",
                      lineHeight: style.lineSpacing,
                    }}
                    className="px-3 py-1.5 rounded-xl flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center"
                  >
                    {visibleChunk.map((w) => {
                      const isCurrentWord =
                        effectiveWords[currentIdx]?.id === w.id;
                      const displayWord = style.uppercase
                        ? w.word.toUpperCase()
                        : style.autoPunctuation
                        ? w.word
                        : w.word.replace(/[.,!?]/g, "");

                      return (
                        <motion.span
                          key={w.id}
                          animate={
                            isCurrentWord &&
                            style.animationStyle === "word-pop"
                              ? { scale: 1.14, y: -2 }
                              : { scale: 1, y: 0 }
                          }
                          style={{
                            fontSize: `${Math.min(
                              32,
                              Math.max(16, style.fontSize * 0.72)
                            )}px`,
                            fontWeight: style.fontWeight,
                            color: isCurrentWord
                              ? style.highlightColor
                              : style.textColor,
                          }}
                          className={
                            style.strokeWidth >= 3
                              ? "subtitle-stroke-heavy transition-colors"
                              : "subtitle-stroke-clean transition-colors"
                          }
                        >
                          {displayWord}
                          {style.emojiIntegration && isCurrentWord && w.emoji
                            ? ` ${w.emoji}`
                            : ""}
                        </motion.span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Clean Playback Transport & Scrubber */}
            <div className="w-full space-y-2.5 pt-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-xl bg-[#7655E9] hover:bg-[#6544DC] text-white flex items-center justify-center cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 fill-white" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime = 0;
                      setCurrentTime(0);
                    }}
                    className="w-9 h-9 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-[#737B8C] hover:text-[#171923] flex items-center justify-center cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="font-mono text-xs text-[#737B8C]">
                  {currentTime.toFixed(1)}s / {(trimEnd - trimStart).toFixed(1)}
                  s
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#159B75]">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{editor.audioNormalization ? "-14 LUFS" : "Raw"}</span>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={Math.max(5, trimEnd - trimStart)}
                step={0.1}
                value={currentTime}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCurrentTime(val);
                  if (videoRef.current) {
                    videoRef.current.currentTime = val;
                  }
                }}
                className="w-full accent-[#7655E9] cursor-pointer"
              />
            </div>
          </div>

          {/* Minimal Multi-Track Timeline */}
          <div className="rounded-2xl bg-white border border-[#E9ECF2] p-4 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-[#171923]">
              <span>Timeline Tracks</span>
              <span className="text-[#737B8C]">
                {trimStart}s – {trimEnd}s
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="h-7 rounded-lg bg-[#F2EEFF] px-3 flex items-center justify-between text-[#7655E9] font-medium">
                <span>Captions • {style.presetId}</span>
                <span>{effectiveWords.length} words</span>
              </div>
              <div className="h-7 rounded-lg bg-[#FAFBFD] border border-[#E9ECF2] px-3 flex items-center justify-between text-[#737B8C]">
                <span>
                  Video •{" "}
                  {editor.autoFaceTracking ? "Speaker Tracking" : "Center Crop"}
                </span>
                <span>{editor.zoomScale}x zoom</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Clean 4-Tab Control Workspace (7 Cols) */}
        <div className="xl:col-span-7 rounded-2xl bg-white border border-[#E9ECF2] p-6 flex flex-col space-y-6 shadow-xs">
          {/* Segmented Control Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2]">
            {[
              { id: "presets" as const, label: "Presets", icon: Sparkles },
              { id: "style" as const, label: "Typography", icon: Type },
              { id: "words" as const, label: "Transcript", icon: Languages },
              { id: "smart-edit" as const, label: "Framing & Cut", icon: Scissors },
            ].map((tab) => {
              const Icon = tab.icon;
              const isAct = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isAct
                      ? "bg-white text-[#7655E9] shadow-xs border border-[#E9ECF2]"
                      : "text-[#737B8C] hover:text-[#171923]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: SUBTITLE PRESETS */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#171923]">
                  Subtitle Presets
                </h3>
                <p className="text-xs text-[#737B8C]">
                  Select a kinetic caption style for your short-form video.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {SUBTITLE_PRESETS.map((preset) => {
                  const isSelected = style.presetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset.id)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? "bg-[#F2EEFF]/50 border-[#7655E9]"
                          : "bg-[#FAFBFD] border-[#E9ECF2] hover:border-[#D8D0F8]"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#171923]">
                            {preset.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#7655E9] text-white font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#737B8C] line-clamp-2">
                          {preset.tagline}
                        </p>
                      </div>

                      <div className="py-2.5 px-3 rounded-lg bg-[#171923] flex items-center justify-center gap-1.5 overflow-hidden">
                        {preset.previewWords.map((pw, i) => (
                          <span
                            key={i}
                            style={{
                              color:
                                i === 1
                                  ? preset.config.highlightColor
                                  : preset.config.textColor,
                              fontWeight: preset.config.fontWeight,
                            }}
                            className="text-xs tracking-tight"
                          >
                            {pw}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TYPOGRAPHY & ANIMATION */}
          {activeTab === "style" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Font Family
                  </label>
                  <select
                    value={style.fontFamily}
                    onChange={(e) =>
                      setStyle({
                        ...style,
                        fontFamily:
                          e.target.value as SubtitleStyleConfig["fontFamily"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                  >
                    {[
                      "Montserrat",
                      "Bebas Neue",
                      "Inter",
                      "Space Grotesk",
                      "Roboto Condensed",
                      "Geist",
                    ].map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Font Size ({style.fontSize}px)
                  </label>
                  <input
                    type="range"
                    min={18}
                    max={48}
                    value={style.fontSize}
                    onChange={(e) =>
                      setStyle({ ...style, fontSize: Number(e.target.value) })
                    }
                    className="w-full accent-[#7655E9]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Font Weight
                  </label>
                  <select
                    value={style.fontWeight}
                    onChange={(e) =>
                      setStyle({
                        ...style,
                        fontWeight:
                          e.target.value as SubtitleStyleConfig["fontWeight"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                  >
                    <option value="600">SemiBold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">ExtraBold (800)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={style.textColor}
                      onChange={(e) =>
                        setStyle({ ...style, textColor: e.target.value })
                      }
                      className="w-8 h-8 rounded border border-[#E9ECF2] cursor-pointer"
                    />
                    <span className="text-xs font-mono text-[#737B8C]">
                      {style.textColor}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Active Word Highlight
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={style.highlightColor}
                      onChange={(e) =>
                        setStyle({ ...style, highlightColor: e.target.value })
                      }
                      className="w-8 h-8 rounded border border-[#E9ECF2] cursor-pointer"
                    />
                    <span className="text-xs font-mono text-[#737B8C]">
                      {style.highlightColor}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Word Animation
                  </label>
                  <select
                    value={style.animationStyle}
                    onChange={(e) =>
                      setStyle({
                        ...style,
                        animationStyle:
                          e.target.value as SubtitleStyleConfig["animationStyle"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                  >
                    <option value="word-pop">Word Pop Scale</option>
                    <option value="karaoke-fill">Karaoke Sweep</option>
                    <option value="slide-up">Smooth Slide Up</option>
                    <option value="typewriter">Typewriter</option>
                    <option value="none">Static Clean</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Vertical Position ({style.positionY}%)
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={85}
                    value={style.positionY}
                    onChange={(e) =>
                      setStyle({ ...style, positionY: Number(e.target.value) })
                    }
                    className="w-full accent-[#7655E9]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Words Per Line ({style.maxWordsPerLine})
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    value={style.maxWordsPerLine}
                    onChange={(e) =>
                      setStyle({
                        ...style,
                        maxWordsPerLine: Number(e.target.value),
                      })
                    }
                    className="w-full accent-[#7655E9]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Backdrop Opacity ({Math.round(style.backgroundOpacity * 100)}
                    %)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={style.backgroundOpacity}
                    onChange={(e) =>
                      setStyle({
                        ...style,
                        backgroundOpacity: Number(e.target.value),
                      })
                    }
                    className="w-full accent-[#7655E9]"
                  />
                </div>
              </div>

              {/* Clean Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E9ECF2]">
                {[
                  { key: "emojiIntegration" as const, label: "Auto Emojis" },
                  { key: "speakerIdentification" as const, label: "Speaker Label" },
                  { key: "autoPunctuation" as const, label: "Punctuation" },
                  { key: "uppercase" as const, label: "Uppercase" },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      setStyle({ ...style, [item.key]: !style[item.key] })
                    }
                    className={`p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                      style[item.key]
                        ? "bg-[#F2EEFF] border-[#7655E9] text-[#7655E9]"
                        : "bg-[#FAFBFD] border-[#E9ECF2] text-[#737B8C]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Multilingual Translation */}
              <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-[#171923]">
                    Subtitle Translation
                  </div>
                  <div className="text-xs text-[#737B8C]">
                    Translate captions while preserving word timestamps.
                  </div>
                </div>
                <select
                  value={style.translateTo || "en"}
                  onChange={(e) => {
                    const nextLang = e.target.value;
                    const nextStyle = { ...style, translateTo: nextLang };
                    setStyle(nextStyle);
                    persistUpdates(
                      nextStyle,
                      words,
                      editor,
                      trimStart,
                      trimEnd
                    );
                  }}
                  className="px-3 py-2 rounded-xl bg-white border border-[#E9ECF2] text-xs text-[#171923]"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB 3: WORD-BY-WORD TRANSCRIPT EDITOR */}
          {activeTab === "words" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#171923]">
                    Word-by-Word Transcript
                  </h3>
                  <p className="text-xs text-[#737B8C]">
                    Click any word to jump playback or edit caption text inline.
                  </p>
                </div>
                <span className="text-xs text-[#9CA3AF]">
                  {words.length} words
                </span>
              </div>

              <div className="max-h-[400px] overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {words.map((w) => {
                  const isCurrent =
                    currentTime >= w.start && currentTime <= w.end + 0.2;
                  return (
                    <div
                      key={w.id}
                      onClick={() => setCurrentTime(w.start)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                        isCurrent
                          ? "bg-[#F2EEFF] border-[#7655E9]"
                          : "bg-[#FAFBFD] border-[#E9ECF2]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#9CA3AF]">
                        <span>
                          {w.start}s–{w.end}s
                        </span>
                        <span className="text-[#7655E9] font-sans font-medium">
                          {w.speaker}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={w.word}
                        onChange={(e) =>
                          handleWordTextChange(w.id, e.target.value)
                        }
                        className="w-full bg-white px-2 py-1 rounded-lg border border-[#E9ECF2] focus:border-[#7655E9] focus:outline-none text-xs text-[#171923] font-medium"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: SMART VIDEO EDITOR */}
          {activeTab === "smart-edit" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#737B8C]">
                    Start Time (s)
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    max={Math.max(0, trimEnd - 4)}
                    value={trimStart}
                    onChange={(e) => setTrimStart(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-[#E9ECF2] text-xs text-[#171923]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#737B8C]">
                    End Time (s)
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    min={trimStart + 4}
                    max={60}
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-[#E9ECF2] text-xs text-[#171923]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#737B8C]">
                    Camera Zoom ({editor.zoomScale}x)
                  </label>
                  <input
                    type="range"
                    min={1.0}
                    max={1.6}
                    step={0.02}
                    value={editor.zoomScale}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        zoomScale: Number(e.target.value),
                      })
                    }
                    className="w-full mt-2.5 accent-[#7655E9]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    key: "autoFaceTracking" as const,
                    label: "Face Tracking",
                    sub: "Center active speaker in frame",
                  },
                  {
                    key: "activeSpeakerDetection" as const,
                    label: "Speaker Switching",
                    sub: "Auto-cut camera to talking guest",
                  },
                  {
                    key: "smartVerticalReframing" as const,
                    label: "Smart Reframing",
                    sub: "Dynamic vertical composition",
                  },
                  {
                    key: "removeSilence" as const,
                    label: "Trim Silence",
                    sub: "Remove dead air pauses > 350ms",
                  },
                  {
                    key: "removeFillerWords" as const,
                    label: "Remove Filler Words",
                    sub: "Filter 'um', 'uh' automatically",
                  },
                  {
                    key: "audioNormalization" as const,
                    label: "Studio Audio (-14 LUFS)",
                    sub: "Normalize voice loudness",
                  },
                ].map((feat) => (
                  <button
                    key={feat.key}
                    type="button"
                    onClick={() =>
                      setEditor({ ...editor, [feat.key]: !editor[feat.key] })
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      editor[feat.key]
                        ? "bg-[#F2EEFF]/60 border-[#7655E9] text-[#171923]"
                        : "bg-[#FAFBFD] border-[#E9ECF2] text-[#737B8C]"
                    }`}
                  >
                    <div className="text-xs font-semibold text-[#171923]">
                      {feat.label}
                    </div>
                    <div className="text-[11px] text-[#737B8C] mt-0.5">
                      {feat.sub}
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E9ECF2]">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#737B8C] flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-[#7655E9]" />
                    <span>Background Music</span>
                  </label>
                  <select
                    value={editor.backgroundMusicId}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        backgroundMusicId:
                          e.target.value as SmartEditorSettings["backgroundMusicId"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                  >
                    {LICENSED_MUSIC_TRACKS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#737B8C] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#4B9DF8]" />
                    <span>Brand Watermark</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editor.watermarkText}
                      onChange={(e) =>
                        setEditor({ ...editor, watermarkText: e.target.value })
                      }
                      className="flex-1 px-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditor({
                          ...editor,
                          watermarkEnabled: !editor.watermarkEnabled,
                        })
                      }
                      className={`px-3.5 py-2 rounded-xl border text-xs font-medium cursor-pointer ${
                        editor.watermarkEnabled
                          ? "bg-[#E8F8F2] border-[#159B75]/40 text-[#159B75]"
                          : "bg-[#FAFBFD] border-[#E9ECF2] text-[#737B8C]"
                      }`}
                    >
                      {editor.watermarkEnabled ? "On" : "Off"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
