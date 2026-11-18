"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  ArrowUpRight,
  Play,
  Scissors,
  Rocket,
  Sparkles,
  Link2,
} from "lucide-react";
import {
  GeneratedClip,
  NavSectionId,
  ProcessingJob,
  TrendingVideoItem,
  VideoProject,
} from "@/lib/types";

interface OverviewDashboardProps {
  projects: VideoProject[];
  clips: GeneratedClip[];
  jobs: ProcessingJob[];
  trendingVideos: TrendingVideoItem[];
  creatorName?: string;
  onNavigate: (section: NavSectionId) => void;
  onOpenClipInStudio: (clip: GeneratedClip) => void;
  onOpenPublishingStudio: (clip: GeneratedClip) => void;
  onOpenExportModal: (clip: GeneratedClip) => void;
  onGenerateFromTrending: (videoUrl: string) => void;
}

export function OverviewDashboard({
  projects,
  clips,
  trendingVideos,
  creatorName = "Alex",
  onNavigate,
  onOpenClipInStudio,
  onOpenPublishingStudio,
  onOpenExportModal,
  onGenerateFromTrending,
}: OverviewDashboardProps) {
  const [quickUrl, setQuickUrl] = useState("");

  const totalVideos = projects.length;
  const totalClips = clips.length;
  const totalHoursSaved = (totalVideos * 3.4 + totalClips * 0.65).toFixed(1);
  const avgViralScore = Math.round(
    clips.reduce((acc, c) => acc + c.viralScore, 0) / Math.max(1, clips.length)
  );

  const handleQuickAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const target =
      quickUrl.trim() || "https://www.youtube.com/watch?v=M7lc1UVf-VE";
    onGenerateFromTrending(target);
  };

  return (
    <div className="space-y-12 pb-20 max-w-6xl mx-auto">
      {/* 1. Editorial Greeting & Primary CTA */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-2">
        <div className="space-y-1.5">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#171923]">
            Good morning, {creatorName}.
          </h1>
          <p className="text-base text-[#737B8C]">
            Ready to create something worth watching?
          </p>
        </div>

        <button
          onClick={() => onNavigate("create-clips")}
          className="px-5 py-2.5 rounded-xl bg-[#7655E9] hover:bg-[#6544DC] text-white text-sm font-medium shadow-sm shadow-[#7655E9]/20 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Clips</span>
        </button>
      </section>

      {/* 2. Clean URL Input Card */}
      <section className="bg-white border border-[#E9ECF2] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#171923]">
            <Sparkles className="w-4 h-4 text-[#7655E9]" />
            <span>Paste a YouTube link and discover its best moments.</span>
          </div>

          <form
            onSubmit={handleQuickAnalyze}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 text-[#9CA3AF] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] focus:bg-white focus:border-[#7655E9] focus:outline-none text-sm text-[#171923] placeholder:text-[#9CA3AF] transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#171923] hover:bg-[#2A2E3D] text-white text-sm font-medium transition-colors cursor-pointer shrink-0"
            >
              Analyze Video
            </button>
          </form>
        </div>
      </section>

      {/* 3. YOUR WORKSPACE (Minimal 4 Statistics) */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
          YOUR WORKSPACE
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Videos processed", value: `${totalVideos}` },
            { label: "Clips created", value: `${totalClips}` },
            { label: "Hours saved", value: `${totalHoursSaved}h` },
            { label: "Average clip score", value: `${avgViralScore}` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-[#E9ECF2] rounded-2xl p-5 space-y-1"
            >
              <div className="text-xs text-[#737B8C]">{stat.label}</div>
              <div className="text-2xl font-semibold text-[#171923] tracking-tight">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. RECENT PROJECTS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
            RECENT PROJECTS
          </h2>
          <button
            onClick={() => onNavigate("my-projects")}
            className="text-xs font-medium text-[#737B8C] hover:text-[#171923] transition-colors cursor-pointer"
          >
            View all projects →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {projects.slice(0, 3).map((proj) => (
            <motion.div
              key={proj.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18 }}
              className="bg-white border border-[#E9ECF2] hover:border-[#D8D0F8] rounded-2xl overflow-hidden flex flex-col justify-between transition-all shadow-xs group"
            >
              <div>
                <div className="relative aspect-video bg-[#F5F7FA] overflow-hidden">
                  <img
                    src={proj.thumbnailUrl}
                    alt={proj.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[11px] font-medium text-[#159B75]">
                    {proj.status === "completed" ? "Ready" : proj.status}
                  </span>
                </div>

                <div className="p-5 space-y-1.5">
                  <h3 className="text-sm font-medium text-[#171923] line-clamp-1">
                    {proj.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#737B8C]">
                    <span>{proj.clipIds.length} clips</span>
                    <span>•</span>
                    <span>
                      Updated{" "}
                      {new Date(proj.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-4 pt-2 border-t border-[#E9ECF2]/60 flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF] truncate max-w-[140px]">
                  {proj.channelName}
                </span>
                <button
                  onClick={() => onNavigate("my-projects")}
                  className="text-xs font-medium text-[#7655E9] hover:text-[#5E3FD6] flex items-center gap-1 cursor-pointer"
                >
                  <span>Open project</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. TRENDING OPPORTUNITIES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
            TRENDING OPPORTUNITIES
          </h2>
          <button
            onClick={() => onNavigate("trending-now")}
            className="text-xs font-medium text-[#737B8C] hover:text-[#171923] transition-colors cursor-pointer"
          >
            Explore all trends →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {trendingVideos.slice(0, 3).map((video) => (
            <div
              key={video.id}
              className="bg-white border border-[#E9ECF2] hover:border-[#D8D0F8] rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all shadow-xs"
            >
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-[#F5F7FA]">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-white/95 text-[11px] font-medium text-[#171923]">
                    {video.category}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-[#171923] line-clamp-2 leading-snug">
                    {video.title}
                  </h3>
                  <p className="text-xs text-[#737B8C]">
                    {video.channelName} • ~
                    {(video.estimatedViewsPerHour / 1000).toFixed(1)}K views/hr
                  </p>
                </div>
              </div>

              <button
                onClick={() => onGenerateFromTrending(video.youtubeUrl)}
                className="w-full py-2 px-3 rounded-xl bg-[#F2EEFF] hover:bg-[#E7E0FF] text-[#7655E9] text-xs font-medium transition-colors cursor-pointer"
              >
                Create clips from video
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 6. RECENT CLIPS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
            RECENT CLIPS
          </h2>
          <button
            onClick={() => onNavigate("clip-library")}
            className="text-xs font-medium text-[#737B8C] hover:text-[#171923] transition-colors cursor-pointer"
          >
            Open clip library →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {clips.slice(0, 4).map((clip) => (
            <motion.div
              key={clip.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18 }}
              className="bg-white border border-[#E9ECF2] hover:border-[#D8D0F8] rounded-2xl overflow-hidden flex flex-col justify-between transition-all shadow-xs group"
            >
              <div>
                {/* Thumbnail with subtle hover actions */}
                <div className="relative aspect-[16/10] bg-[#F5F7FA] overflow-hidden">
                  <img
                    src={clip.thumbnailUrl}
                    alt={clip.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-white/95 text-[11px] font-medium text-[#171923]">
                      {clip.duration}s
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/95 text-[11px] font-medium text-[#737B8C]">
                      {clip.aspectRatio}
                    </span>
                  </div>
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-[#F2EEFF] text-[#7655E9] text-[11px] font-semibold">
                    {clip.viralScore}
                  </span>
                </div>

                <div className="p-4 space-y-1">
                  <h3 className="text-sm font-medium text-[#171923] line-clamp-2 leading-snug">
                    {clip.title}
                  </h3>
                  <p className="text-xs text-[#9CA3AF] truncate">
                    {clip.projectTitle}
                  </p>
                </div>
              </div>

              {/* Clean Quick Actions */}
              <div className="px-4 pb-4 pt-2 flex items-center justify-between gap-2 border-t border-[#E9ECF2]/60">
                <button
                  onClick={() => onOpenExportModal(clip)}
                  className="text-xs font-medium text-[#737B8C] hover:text-[#171923] flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => onOpenClipInStudio(clip)}
                  className="text-xs font-medium text-[#737B8C] hover:text-[#171923] flex items-center gap-1 cursor-pointer"
                >
                  <Scissors className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => onOpenPublishingStudio(clip)}
                  className="text-xs font-medium text-[#7655E9] hover:text-[#5E3FD6] flex items-center gap-1 cursor-pointer"
                >
                  <Rocket className="w-3 h-3" />
                  <span>Publish</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
