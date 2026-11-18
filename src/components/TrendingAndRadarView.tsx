"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Wand2,
  TrendingUp,
  Search,
  Mic,
  ArrowUpRight,
} from "lucide-react";
import {
  DatabaseSchema,
  GeneratedClip,
  TrendingVideoItem,
  ViralRadarData,
} from "@/lib/types";

interface TrendingAndRadarViewProps {
  mode: "trending-now" | "opportunity-radar" | "viral-radar" | "analytics";
  trendingVideos: TrendingVideoItem[];
  viralRadar: ViralRadarData;
  clips: GeneratedClip[];
  onGenerateFromUrl: (url: string) => void;
  onOpenPublishingStudio?: () => void;
  onSnapshotUpdated: (db: DatabaseSchema) => void;
}

const COUNTRIES = [
  "All",
  "India",
  "United States",
  "United Kingdom",
  "Global",
] as const;

const CATEGORIES = [
  "All",
  "Gaming",
  "Entertainment",
  "Education",
  "Technology",
  "Podcasts",
  "Business",
  "News",
  "Motivation",
  "Sports",
] as const;

export function TrendingAndRadarView({
  mode,
  trendingVideos,
  viralRadar,
  onGenerateFromUrl,
  onOpenPublishingStudio,
  onSnapshotUpdated,
}: TrendingAndRadarViewProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSnapshotting, setIsSnapshotting] = useState(false);

  const handleTakeSnapshot = async () => {
    setIsSnapshotting(true);
    try {
      const res = await fetch("/api/trending/snapshot", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        onSnapshotUpdated(data.db);
      }
    } finally {
      setIsSnapshotting(false);
    }
  };

  const filteredTrending = trendingVideos.filter((v) => {
    if (selectedCountry !== "All" && v.country !== selectedCountry)
      return false;
    if (selectedCategory !== "All" && v.category !== selectedCategory)
      return false;
    if (
      searchQuery.trim() &&
      !v.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !v.topic.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !v.channelName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  if (mode === "trending-now") {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-[#171923]">
              Trending Now
            </h1>
            <p className="text-sm text-[#737B8C]">
              Discover high-velocity videos across regions and categories ready
              to repurpose into short-form clips.
            </p>
          </div>

          <button
            onClick={handleTakeSnapshot}
            disabled={isSnapshotting}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAFBFD] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center gap-2 shadow-xs cursor-pointer self-start md:self-auto"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#7655E9] ${
                isSnapshotting ? "animate-spin" : ""
              }`}
            />
            <span>
              {isSnapshotting ? "Refreshing velocity..." : "Refresh Velocity"}
            </span>
          </button>
        </div>

        {/* Clean Filter Surface */}
        <div className="bg-white border border-[#E9ECF2] rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Country Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {COUNTRIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCountry(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    selectedCountry === c
                      ? "bg-[#F2EEFF] text-[#7655E9]"
                      : "bg-[#FAFBFD] text-[#737B8C] hover:text-[#171923]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos or topics..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] focus:bg-white focus:border-[#7655E9] focus:outline-none text-xs text-[#171923]"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-[#E9ECF2]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#171923] text-white"
                    : "bg-[#FAFBFD] text-[#737B8C] hover:text-[#171923]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Editorial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrending.map((video, idx) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              whileHover={{ y: -2 }}
              className="bg-white border border-[#E9ECF2] hover:border-[#D8D0F8] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs transition-all group"
            >
              <div>
                {/* Large Video Thumbnail */}
                <div className="relative aspect-video bg-[#F5F7FA] overflow-hidden">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-md bg-white/95 text-xs font-medium text-[#171923]">
                    {video.category}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-md bg-[#E8F8F2] text-[#159B75] text-xs font-semibold">
                    +{video.accelerationPercent}% growth
                  </span>
                </div>

                {/* Editorial Content */}
                <div className="p-5 space-y-2.5">
                  <div className="text-xs text-[#737B8C]">
                    {video.channelName} • {video.country}
                  </div>
                  <h3 className="text-base font-semibold text-[#171923] leading-snug line-clamp-2">
                    {video.title}
                  </h3>

                  <div className="flex items-center justify-between pt-2 text-xs text-[#737B8C]">
                    <span>{video.currentViews.toLocaleString()} views</span>
                    <span className="font-medium text-[#7655E9]">
                      ~{video.estimatedViewsPerHour.toLocaleString()} views/hr
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-[#E9ECF2]/70">
                <button
                  onClick={() => onGenerateFromUrl(video.youtubeUrl)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F2EEFF] hover:bg-[#E5DCFF] text-[#7655E9] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Create Clips From Video</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // OPPORTUNITY RADAR
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="pt-2 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-[#171923]">
          Opportunity Radar
        </h1>
        <p className="text-sm text-[#737B8C]">
          Emerging topics, breakout podcast moments, and low-competition
          keywords before they saturate.
        </p>
      </div>

      {/* Emerging Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {viralRadar.emergingTopics.map((topic) => (
          <div
            key={topic.id}
            className="bg-white border border-[#E9ECF2] rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-xs"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md bg-[#E8F8F2] text-[#159B75] text-xs font-medium">
                  {topic.saturationLevel}
                </span>
                <span className="text-xs font-semibold text-[#7655E9]">
                  +{topic.searchGrowthPercent}% search growth
                </span>
              </div>

              <h3 className="text-lg font-semibold text-[#171923]">
                {topic.topic}
              </h3>

              <p className="text-xs text-[#737B8C] bg-[#FAFBFD] p-3.5 rounded-xl border border-[#E9ECF2] leading-relaxed">
                <strong className="text-[#171923]">Suggested Angle:</strong>{" "}
                &ldquo;{topic.recommendedHookAngle}&rdquo;
              </p>

              <div className="flex flex-wrap gap-1.5">
                {topic.sampleKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2.5 py-0.5 rounded-md bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#737B8C]"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#E9ECF2]">
              <button
                onClick={() =>
                  onGenerateFromUrl(
                    topic.sampleYoutubeUrl ||
                      "https://www.youtube.com/watch?v=M7lc1UVf-VE"
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-[#7655E9] hover:bg-[#6544DC] text-white text-xs font-medium cursor-pointer"
              >
                Create Clips
              </button>
              {onOpenPublishingStudio && (
                <button
                  onClick={onOpenPublishingStudio}
                  className="px-3.5 py-2 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center gap-1 cursor-pointer"
                >
                  <span>Publishing Studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Podcast Moments & Breakout Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E9ECF2] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-base font-semibold text-[#171923]">
            <Mic className="w-4 h-4 text-[#7655E9]" />
            <span>High-Signal Podcast Moments</span>
          </div>
          <div className="space-y-3">
            {viralRadar.podcastMoments.map((pm) => (
              <div
                key={pm.id}
                className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#7655E9]">
                    {pm.podcastName} • {pm.guestName}
                  </span>
                  <span className="text-xs font-medium text-[#159B75]">
                    Score {pm.viralPotential}
                  </span>
                </div>
                <p className="text-sm text-[#171923] italic">
                  &ldquo;{pm.quoteHook}&rdquo;
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-[#737B8C]">
                    {pm.timestampRange} • {pm.topic}
                  </span>
                  <button
                    onClick={() =>
                      onGenerateFromUrl(
                        `https://www.youtube.com/watch?v=${pm.youtubeVideoId}`
                      )
                    }
                    className="text-xs font-medium text-[#7655E9] hover:underline cursor-pointer"
                  >
                    Clip this moment →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E9ECF2] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-base font-semibold text-[#171923]">
            <TrendingUp className="w-4 h-4 text-[#159B75]" />
            <span>Breakout Search Keywords</span>
          </div>
          <div className="space-y-2.5">
            {viralRadar.trendingKeywords.map((kw) => (
              <div
                key={kw.keyword}
                className="p-3.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-[#171923]">
                    #{kw.keyword}
                  </div>
                  <div className="text-[11px] text-[#737B8C]">
                    {kw.niche} • {kw.competition} competition
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#159B75]">
                  +{kw.growthPercent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
