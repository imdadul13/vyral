"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Download,
  Copy,
  Trash2,
  CheckCircle2,
  Loader2,
  X,
  Play,
  Scissors,
  Rocket,
  Search,
  Wand2,
} from "lucide-react";
import {
  DatabaseSchema,
  GeneratedClip,
  PlatformSettings,
  VideoProject,
} from "@/lib/types";

interface LibraryAndProjectsViewProps {
  mode: "clip-library" | "my-projects";
  projects: VideoProject[];
  clips: GeneratedClip[];
  settings: PlatformSettings;
  onOpenClipInStudio: (clip: GeneratedClip) => void;
  onOpenPublishingStudio: (clip: GeneratedClip) => void;
  onOpenExportModal: (clip: GeneratedClip) => void;
  onDbUpdated: (db: DatabaseSchema) => void;
}

export function LibraryAndProjectsView({
  mode,
  projects,
  clips,
  onOpenClipInStudio,
  onOpenPublishingStudio,
  onOpenExportModal,
  onDbUpdated,
}: LibraryAndProjectsViewProps) {
  const [activeFilter, setActiveFilter] = useState<
    "all" | "ready" | "favorites" | "published"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleAction = async (
    action: "toggle_favorite" | "duplicate_clip" | "delete_clip",
    clipId: string
  ) => {
    const res = await fetch("/api/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, clipId }),
    });
    if (res.ok) {
      const data = await res.json();
      onDbUpdated(data.db);
    }
  };

  const filteredClips = clips.filter((c) => {
    if (activeFilter === "favorites" && !c.isFavorite) return false;
    if (activeFilter === "ready" && c.status !== "ready") return false;
    if (activeFilter === "published" && c.status !== "published") return false;
    if (
      searchQuery.trim() &&
      !c.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.projectTitle.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  if (mode === "my-projects") {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Editorial Header */}
        <div className="pt-2 space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-[#171923]">
            My Projects
          </h1>
          <p className="text-sm text-[#737B8C]">
            Long-form videos analyzed by VYRAL and organized with their generated
            short-form clips.
          </p>
        </div>

        {/* Projects List */}
        <div className="space-y-6">
          {projects.map((proj) => {
            const projClips = clips.filter((c) => c.projectId === proj.id);
            return (
              <div
                key={proj.id}
                className="bg-white border border-[#E9ECF2] rounded-2xl p-6 space-y-6 shadow-xs"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E9ECF2]">
                  <div className="flex items-center gap-4">
                    <img
                      src={proj.thumbnailUrl}
                      alt={proj.title}
                      className="w-28 h-16 rounded-xl object-cover border border-[#E9ECF2] shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#E8F8F2] text-[#159B75] text-[11px] font-medium">
                          {proj.status === "completed" ? "Ready" : proj.status}
                        </span>
                        <span className="text-xs text-[#9CA3AF]">
                          {projClips.length} clips • Avg score {proj.avgViralScore}
                        </span>
                      </div>
                      <h2 className="text-base font-semibold text-[#171923]">
                        {proj.title}
                      </h2>
                      <p className="text-xs text-[#737B8C]">
                        {proj.channelName} • Updated{" "}
                        {new Date(proj.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Project Clips Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projClips.map((clip) => (
                    <div
                      key={clip.id}
                      className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] hover:border-[#D8D0F8] flex flex-col justify-between gap-3 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#737B8C]">
                            {clip.duration}s • {clip.aspectRatio}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#F2EEFF] text-[#7655E9] font-semibold">
                            {clip.viralScore}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-[#171923] line-clamp-2">
                          {clip.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E9ECF2]">
                        <button
                          onClick={() => onOpenExportModal(clip)}
                          className="text-xs font-medium text-[#737B8C] hover:text-[#171923] cursor-pointer"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => onOpenClipInStudio(clip)}
                          className="text-xs font-medium text-[#737B8C] hover:text-[#171923] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onOpenPublishingStudio(clip)}
                          className="text-xs font-medium text-[#7655E9] hover:text-[#5E3FD6] cursor-pointer"
                        >
                          Publishing Studio →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // CLIP LIBRARY — Visual Gallery Redesign (Section 7)
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header & Clean Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-[#171923]">
            Clip Library
          </h1>
          <p className="text-sm text-[#737B8C]">
            Browse, preview, edit, and prepare your generated short-form clips for
            publishing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clips..."
              className="pl-8 pr-3 py-2 rounded-xl bg-white border border-[#E9ECF2] focus:border-[#7655E9] focus:outline-none text-xs text-[#171923] w-48"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-[#E9ECF2]">
            {(
              [
                { id: "all", label: "All" },
                { id: "ready", label: "Ready" },
                { id: "favorites", label: "Saved" },
                { id: "published", label: "Published" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeFilter === f.id
                    ? "bg-[#F2EEFF] text-[#7655E9]"
                    : "text-[#737B8C] hover:text-[#171923]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClips.map((clip) => (
          <motion.div
            key={clip.id}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18 }}
            className="bg-white border border-[#E9ECF2] hover:border-[#D8D0F8] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs transition-all group"
          >
            <div>
              {/* Large Visual Thumbnail */}
              <div className="relative aspect-[16/10] bg-[#F5F7FA] overflow-hidden">
                <img
                  src={clip.thumbnailUrl}
                  alt={clip.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />

                {/* Top Left: Duration & Aspect Ratio */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-xs font-medium text-[#171923]">
                    {clip.duration}s
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-xs font-medium text-[#737B8C]">
                    {clip.aspectRatio}
                  </span>
                </div>

                {/* Top Right: Viral Potential Score */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#F2EEFF] text-[#7655E9] text-xs font-semibold">
                    Score {clip.viralScore}
                  </span>
                </div>

                {/* Subtle Hover Utility Icons (Bookmark, Duplicate, Delete) */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                  <button
                    onClick={() => handleAction("toggle_favorite", clip.id)}
                    title="Save clip"
                    className="p-1.5 rounded-lg bg-white/95 hover:bg-white text-[#171923] shadow-xs cursor-pointer"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        clip.isFavorite
                          ? "text-amber-500 fill-amber-500"
                          : "text-[#737B8C]"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleAction("duplicate_clip", clip.id)}
                    title="Duplicate clip"
                    className="p-1.5 rounded-lg bg-white/95 hover:bg-white text-[#737B8C] hover:text-[#171923] shadow-xs cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleAction("delete_clip", clip.id)}
                    title="Delete clip"
                    className="p-1.5 rounded-lg bg-white/95 hover:bg-white text-[#737B8C] hover:text-rose-600 shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Minimal Metadata */}
              <div className="p-5 space-y-1.5">
                <h3 className="text-base font-semibold text-[#171923] leading-snug line-clamp-2">
                  {clip.title}
                </h3>
                <p className="text-xs text-[#9CA3AF] truncate">
                  {clip.projectTitle}
                </p>
              </div>
            </div>

            {/* Clean 3-Action Bar: Preview, Edit, Publishing Studio */}
            <div className="px-5 pb-5 pt-3 border-t border-[#E9ECF2]/70 flex items-center justify-between gap-2">
              <button
                onClick={() => onOpenExportModal(clip)}
                className="px-3 py-2 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-[#737B8C]" />
                <span>Preview</span>
              </button>

              <button
                onClick={() => onOpenClipInStudio(clip)}
                className="px-3 py-2 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center gap-1.5 cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5 text-[#737B8C]" />
                <span>Edit</span>
              </button>

              <button
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
    </div>
  );
}

/* ============================================================================
   CLEAN LIGHT-MODE EXPORT & FFMPEG RENDER MODAL
   ============================================================================ */
interface SocialExportModalProps {
  clip: GeneratedClip;
  settings: PlatformSettings;
  onClose: () => void;
  onClipRendered: (clip: GeneratedClip, db: DatabaseSchema) => void;
}

export function SocialExportModal({
  clip,
  onClose,
  onClipRendered,
}: SocialExportModalProps) {
  const [title, setTitle] = useState(
    clip.publishingPackage?.selectedTitleText || clip.title
  );
  const [description, setDescription] = useState(
    clip.publishingPackage?.descriptions.shortAndPunchy ||
      clip.suggestedDescription
  );
  const [isRendering, setIsRendering] = useState(false);
  const [renderInfo, setRenderInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRenderMp4 = async () => {
    setIsRendering(true);
    setRenderInfo(null);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId: clip.id }),
      });
      const data = await res.json();
      if (res.ok) {
        onClipRendered(data.clip, data.db);
        setRenderInfo(
          `Rendered ${data.probe.width}x${data.probe.height} MP4 (${data.probe.sizeKb} KB)`
        );
      }
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171923]/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          className="w-full max-w-3xl rounded-2xl bg-white border border-[#E9ECF2] shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-[#E9ECF2] flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#171923]">
                Preview & Export Clip
              </h2>
              <p className="text-xs text-[#737B8C]">
                {clip.aspectRatio} • {clip.resolution} • {clip.fps} FPS •{" "}
                {clip.duration}s
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#FAFBFD] text-[#737B8C] hover:text-[#171923] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Video Player Preview */}
            <div className="md:col-span-5 flex flex-col items-center justify-between p-4 rounded-2xl bg-[#FAFBFD] border border-[#E9ECF2] space-y-3">
              <video
                src={clip.renderedVideoUrl || clip.sourceVideoUrl}
                controls
                playsInline
                className="w-full max-h-[280px] rounded-xl bg-black object-contain"
              />

              <div className="w-full space-y-2">
                <button
                  onClick={handleRenderMp4}
                  disabled={isRendering}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#F2EEFF] hover:bg-[#E5DCFF] text-xs font-medium text-[#7655E9] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  {isRendering ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Rendering MP4...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Render Subtitles into Video</span>
                    </>
                  )}
                </button>

                {renderInfo && (
                  <div className="text-[11px] text-[#159B75] text-center font-medium">
                    ✓ {renderInfo}
                  </div>
                )}

                <a
                  href={clip.renderedVideoUrl || clip.sourceVideoUrl}
                  download={`${clip.id}-vyral.mp4`}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#7655E9] hover:bg-[#6544DC] text-xs font-medium text-white flex items-center justify-center gap-1.5 shadow-sm shadow-[#7655E9]/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4 File</span>
                </a>
              </div>
            </div>

            {/* Right Metadata & Quick Copy */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Clip Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] focus:bg-white focus:border-[#7655E9] focus:outline-none text-xs text-[#171923]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Caption & Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] focus:bg-white focus:border-[#7655E9] focus:outline-none text-xs text-[#171923]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#737B8C]">
                    Hashtags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {clip.hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#737B8C]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E9ECF2] flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${title}\n\n${description}\n\n${clip.hashtags.join(" ")}`
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#159B75]" />
                      <span>Copied metadata</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#737B8C]" />
                      <span>Copy Title & Caption</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-[#171923] hover:bg-[#2A2E3D] text-white text-xs font-medium cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
