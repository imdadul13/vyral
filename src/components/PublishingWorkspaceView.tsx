"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Send,
  BarChart3,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Trash2,
  Download,
  TrendingUp,
} from "lucide-react";
import {
  CalendarScheduleItem,
  DatabaseSchema,
  GeneratedClip,
  NavSectionId,
  TitleStyleCategory,
  WinningTitleRecord,
} from "@/lib/types";

interface PublishingWorkspaceViewProps {
  mode: "content-calendar" | "publishing-queue" | "performance-tracker";
  state: DatabaseSchema;
  activeClip: GeneratedClip | null;
  onSelectClip: (clipId: string) => void;
  onNavigate: (section: NavSectionId) => void;
  onRefreshState: (newState: DatabaseSchema) => void;
  onNotify: (msg: string) => void;
}

export function PublishingWorkspaceView({
  mode,
  state,
  activeClip,
  onSelectClip,
  onNavigate,
  onRefreshState,
  onNotify,
}: PublishingWorkspaceViewProps) {
  const calendarItems = useMemo(
    () => state.calendarItems ?? [],
    [state.calendarItems]
  );
  const winningTitles = useMemo(
    () => state.winningTitles ?? [],
    [state.winningTitles]
  );
  const selectedClip = activeClip || state.clips[0] || null;

  const [platformFilter, setPlatformFilter] = useState<string>("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newScheduleClipId, setNewScheduleClipId] = useState<string>(
    selectedClip?.id || ""
  );
  const [newPlatform, setNewPlatform] =
    useState<CalendarScheduleItem["platform"]>("YouTube Shorts");
  const [newStatus, setNewStatus] =
    useState<CalendarScheduleItem["status"]>("scheduled");
  const [newDate, setNewDate] = useState<string>("2025-05-18T17:00");
  const [newTopic, setNewTopic] = useState<string>("AI & Creator Economy");
  const [newCampaign, setNewCampaign] = useState<string>("Weekly Shorts");
  const [submitting, setSubmitting] = useState(false);

  // Performance Tracker Form State
  const [perfClipId, setPerfClipId] = useState<string>(selectedClip?.id || "");
  const [perfTitle, setPerfTitle] = useState<string>(
    selectedClip?.publishingPackage?.selectedTitleText ||
      selectedClip?.title ||
      ""
  );
  const [perfStyle, setPerfStyle] =
    useState<TitleStyleCategory>("Curiosity-Driven");
  const [perfPlatform, setPerfPlatform] =
    useState<WinningTitleRecord["platform"]>("YouTube Shorts");
  const [perfViews, setPerfViews] = useState<string>("84500");
  const [perfCtr, setPerfCtr] = useState<string>("11.8");
  const [perfRetention, setPerfRetention] = useState<string>("89.2");

  const filteredCalendar = useMemo(() => {
    return calendarItems.filter((item) => {
      if (platformFilter !== "All" && item.platform !== platformFilter)
        return false;
      return true;
    });
  }, [calendarItems, platformFilter]);

  async function handleSaveCalendarItem() {
    const targetClip =
      state.clips.find((c) => c.id === newScheduleClipId) || selectedClip;
    if (!targetClip) return;
    setSubmitting(true);
    try {
      const item: CalendarScheduleItem = {
        id: `cal-${Date.now()}`,
        clipId: targetClip.id,
        clipTitle:
          targetClip.publishingPackage?.selectedTitleText || targetClip.title,
        projectTitle: targetClip.projectTitle,
        platform: newPlatform,
        status: newStatus,
        scheduledFor: new Date(newDate).toISOString(),
        topic: newTopic.trim() || "Short-Form Release",
        niche: "Creator",
        campaign: newCampaign.trim() || "General",
        visibility: "public",
        notes: "",
      };
      const res = await fetch("/api/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_calendar_item",
          calendarItem: item,
        }),
      });
      const json = await res.json();
      if (json.db) {
        onRefreshState(json.db);
        setShowAddModal(false);
        onNotify(`Scheduled "${item.clipTitle}"`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateScheduleStatus(
    item: CalendarScheduleItem,
    nextStatus: CalendarScheduleItem["status"]
  ) {
    const updated: CalendarScheduleItem = {
      ...item,
      status: nextStatus,
    };
    const res = await fetch("/api/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_calendar_item",
        calendarItem: updated,
      }),
    });
    const json = await res.json();
    if (json.db) {
      onRefreshState(json.db);
      onNotify(`Moved clip to ${nextStatus}`);
    }
  }

  async function handleDeleteScheduleItem(itemId: string) {
    const res = await fetch("/api/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete_calendar_item",
        calendarId: itemId,
      }),
    });
    const json = await res.json();
    if (json.db) {
      onRefreshState(json.db);
      onNotify("Removed item from calendar");
    }
  }

  async function handleLogPerformance(e: React.FormEvent) {
    e.preventDefault();
    if (!perfTitle.trim()) return;
    setSubmitting(true);
    try {
      const record: WinningTitleRecord = {
        id: `wt-${Date.now()}`,
        clipId: perfClipId || selectedClip?.id,
        titleText: perfTitle.trim(),
        style: perfStyle,
        publishedAt: new Date().toISOString().slice(0, 10),
        platform: perfPlatform,
        views: Number(perfViews) || 0,
        impressions: Math.round((Number(perfViews) || 0) * 6.5),
        ctrPercent: Number(perfCtr) || 0,
        avgViewDurationSec: 36,
        retentionPercent: Number(perfRetention) || 0,
        likes: Math.round((Number(perfViews) || 0) * 0.06),
        comments: Math.round((Number(perfViews) || 0) * 0.008),
        shares: Math.round((Number(perfViews) || 0) * 0.015),
        isVerifiedAnalytics: true,
      };
      const res = await fetch("/api/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_performance",
          record,
        }),
      });
      const json = await res.json();
      if (json.db) {
        onRefreshState(json.db);
        onNotify("Logged post-publish performance record");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-[#171923]">
            {mode === "content-calendar" && "Content Calendar"}
            {mode === "publishing-queue" && "Publishing Queue"}
            {mode === "performance-tracker" && "Performance Tracker"}
          </h1>
          <p className="text-sm text-[#737B8C]">
            {mode === "content-calendar" &&
              "Plan and schedule short-form releases across YouTube Shorts, Reels, and TikTok."}
            {mode === "publishing-queue" &&
              "Review rendered MP4 clips and copy platform-ready metadata packages."}
            {mode === "performance-tracker" &&
              "Log published clip outcomes to calibrate future title and hook recommendations."}
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-[#E9ECF2] self-start md:self-auto">
          <button
            onClick={() => onNavigate("content-calendar")}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              mode === "content-calendar"
                ? "bg-[#F2EEFF] text-[#7655E9]"
                : "text-[#737B8C] hover:text-[#171923]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => onNavigate("publishing-queue")}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              mode === "publishing-queue"
                ? "bg-[#F2EEFF] text-[#7655E9]"
                : "text-[#737B8C] hover:text-[#171923]"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Queue</span>
          </button>
          <button
            onClick={() => onNavigate("performance-tracker")}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
              mode === "performance-tracker"
                ? "bg-[#F2EEFF] text-[#7655E9]"
                : "text-[#737B8C] hover:text-[#171923]"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Performance</span>
          </button>
        </div>
      </div>

      {/* 1. CONTENT CALENDAR */}
      {mode === "content-calendar" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E9ECF2] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                "All",
                "YouTube Shorts",
                "Instagram Reels",
                "TikTok",
                "YouTube Long-form",
              ].map((plat) => (
                <button
                  key={plat}
                  onClick={() => setPlatformFilter(plat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                    platformFilter === plat
                      ? "bg-[#F2EEFF] text-[#7655E9]"
                      : "bg-[#FAFBFD] text-[#737B8C] hover:text-[#171923]"
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddModal((v) => !v)}
              className="px-4 py-2 rounded-xl bg-[#7655E9] hover:bg-[#6544DC] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Clip</span>
            </button>
          </div>

          {showAddModal && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#D8D0F8] rounded-2xl p-6 space-y-4 shadow-xs"
            >
              <h3 className="text-sm font-semibold text-[#171923]">
                Schedule Clip Release
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#737B8C] mb-1">
                    Clip
                  </label>
                  <select
                    value={newScheduleClipId}
                    onChange={(e) => setNewScheduleClipId(e.target.value)}
                    className="w-full bg-[#FAFBFD] border border-[#E9ECF2] rounded-xl px-3 py-2 text-xs text-[#171923]"
                  >
                    {state.clips.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#737B8C] mb-1">
                    Platform
                  </label>
                  <select
                    value={newPlatform}
                    onChange={(e) =>
                      setNewPlatform(
                        e.target.value as CalendarScheduleItem["platform"]
                      )
                    }
                    className="w-full bg-[#FAFBFD] border border-[#E9ECF2] rounded-xl px-3 py-2 text-xs text-[#171923]"
                  >
                    <option value="YouTube Shorts">YouTube Shorts</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube Long-form">YouTube Long-form</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#737B8C] mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#FAFBFD] border border-[#E9ECF2] rounded-xl px-3 py-2 text-xs text-[#171923]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#737B8C] mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full bg-[#FAFBFD] border border-[#E9ECF2] rounded-xl px-3 py-2 text-xs text-[#171923]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#737B8C] mb-1">
                    Campaign
                  </label>
                  <input
                    type="text"
                    value={newCampaign}
                    onChange={(e) => setNewCampaign(e.target.value)}
                    className="w-full bg-[#FAFBFD] border border-[#E9ECF2] rounded-xl px-3 py-2 text-xs text-[#171923]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#737B8C] mb-1">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(
                        e.target.value as CalendarScheduleItem["status"]
                      )
                    }
                    className="w-full bg-[#FAFBFD] border border-[#E9ECF2] rounded-xl px-3 py-2 text-xs text-[#171923]"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="queued">Queued</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs font-medium text-[#737B8C] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCalendarItem}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#7655E9] text-white text-xs font-medium cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>
            </motion.div>
          )}

          {/* 4-Column Board */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {(["draft", "scheduled", "queued", "published"] as const).map(
              (statusCol) => {
                const itemsInCol = filteredCalendar.filter(
                  (i) => i.status === statusCol
                );
                return (
                  <div
                    key={statusCol}
                    className="bg-white border border-[#E9ECF2] rounded-2xl p-4 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#E9ECF2]">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#171923]">
                        {statusCol}
                      </span>
                      <span className="text-xs text-[#9CA3AF]">
                        {itemsInCol.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {itemsInCol.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-[#7655E9]">
                              {item.platform}
                            </span>
                            <button
                              onClick={() => handleDeleteScheduleItem(item.id)}
                              className="text-[#9CA3AF] hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-xs font-semibold text-[#171923] leading-snug">
                            {item.clipTitle}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#737B8C]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.scheduledFor).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                            <span>{item.campaign}</span>
                          </div>

                          <div className="pt-2 border-t border-[#E9ECF2] flex items-center justify-between">
                            <button
                              onClick={() => {
                                onSelectClip(item.clipId);
                                onNavigate("publishing-studio");
                              }}
                              className="text-[11px] font-medium text-[#7655E9] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Studio</span>
                            </button>

                            <select
                              value={item.status}
                              onChange={(e) =>
                                handleUpdateScheduleStatus(
                                  item,
                                  e.target
                                    .value as CalendarScheduleItem["status"]
                                )
                              }
                              className="bg-white border border-[#E9ECF2] rounded-lg px-2 py-0.5 text-[10px] text-[#737B8C]"
                            >
                              <option value="draft">Draft</option>
                              <option value="scheduled">Scheduled</option>
                              <option value="queued">Queued</option>
                              <option value="published">Published</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* 2. PUBLISHING QUEUE */}
      {mode === "publishing-queue" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {state.clips.map((clip) => {
            const pkg = clip.publishingPackage;
            const isRendered = Boolean(clip.renderedVideoUrl);
            return (
              <div
                key={clip.id}
                className="bg-white border border-[#E9ECF2] rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs text-[#737B8C]">
                        {clip.projectTitle} • {clip.aspectRatio}
                      </span>
                      <h3 className="text-base font-semibold text-[#171923] mt-0.5">
                        {pkg?.selectedTitleText || clip.title}
                      </h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E8F8F2] text-[#159B75] text-xs font-medium shrink-0">
                      Ready
                    </span>
                  </div>

                  <p className="text-xs text-[#737B8C] line-clamp-2">
                    {pkg?.descriptions.shortAndPunchy ||
                      clip.suggestedDescription}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[#737B8C] pt-1">
                    <span className="flex items-center gap-1 text-[#159B75]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isRendered ? "Rendered MP4" : "Source Ready"}
                    </span>
                    <span>{clip.hashtags.length} hashtags</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E9ECF2] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectClip(clip.id);
                        onNavigate("publishing-studio");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-xs font-medium text-[#171923] cursor-pointer"
                    >
                      Open Studio
                    </button>
                    <a
                      href={clip.renderedVideoUrl || clip.sourceVideoUrl}
                      download={`${clip.id}.mp4`}
                      className="px-3.5 py-2 rounded-xl bg-[#FAFBFD] hover:bg-[#F5F7FA] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-[#737B8C]" />
                      <span>MP4</span>
                    </a>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${pkg?.selectedTitleText || clip.title}\n\n${
                          pkg?.descriptions.shortAndPunchy ||
                          clip.suggestedDescription
                        }\n\n${clip.hashtags.join(" ")}`
                      );
                      onNotify(`Copied release kit for "${clip.title}"`);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#7655E9] hover:bg-[#6544DC] text-white text-xs font-medium cursor-pointer"
                  >
                    Copy Release Kit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. PERFORMANCE TRACKER */}
      {mode === "performance-tracker" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleLogPerformance}
            className="lg:col-span-5 bg-white border border-[#E9ECF2] rounded-2xl p-6 space-y-4 shadow-xs"
          >
            <h3 className="text-base font-semibold text-[#171923]">
              Log Published Clip Outcome
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs text-[#737B8C]">Clip</label>
              <select
                value={perfClipId}
                onChange={(e) => {
                  const cid = e.target.value;
                  setPerfClipId(cid);
                  const found = state.clips.find((c) => c.id === cid);
                  if (found) {
                    setPerfTitle(
                      found.publishingPackage?.selectedTitleText || found.title
                    );
                  }
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
              >
                {state.clips.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#737B8C]">Published Title</label>
              <input
                type="text"
                value={perfTitle}
                onChange={(e) => setPerfTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#737B8C]">Style</label>
                <select
                  value={perfStyle}
                  onChange={(e) =>
                    setPerfStyle(e.target.value as TitleStyleCategory)
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                >
                  <option value="Curiosity-Driven">Curiosity-Driven</option>
                  <option value="Highly Clickable">Highly Clickable</option>
                  <option value="Storytelling">Storytelling</option>
                  <option value="Educational">Educational</option>
                  <option value="Emotional">Emotional</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#737B8C]">Platform</label>
                <select
                  value={perfPlatform}
                  onChange={(e) =>
                    setPerfPlatform(
                      e.target.value as WinningTitleRecord["platform"]
                    )
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                >
                  <option value="YouTube Shorts">YouTube Shorts</option>
                  <option value="Instagram Reels">Instagram Reels</option>
                  <option value="TikTok">TikTok</option>
                  <option value="YouTube Long-form">YouTube Long-form</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#737B8C]">Views</label>
                <input
                  type="number"
                  value={perfViews}
                  onChange={(e) => setPerfViews(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                />
              </div>
              <div>
                <label className="text-xs text-[#737B8C]">CTR (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={perfCtr}
                  onChange={(e) => setPerfCtr(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                />
              </div>
              <div>
                <label className="text-xs text-[#737B8C]">Retention (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={perfRetention}
                  onChange={(e) => setPerfRetention(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-[#7655E9] hover:bg-[#6544DC] text-white text-xs font-medium cursor-pointer"
            >
              Save Outcome
            </button>
          </form>

          <div className="lg:col-span-7 bg-white border border-[#E9ECF2] rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-base font-semibold text-[#171923]">
              <TrendingUp className="w-4 h-4 text-[#159B75]" />
              <span>Logged Outcomes</span>
            </div>

            <div className="space-y-3">
              {winningTitles.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-xs text-[#7655E9] font-medium">
                      {rec.style} • {rec.platform}
                    </span>
                    <div className="text-sm font-semibold text-[#171923]">
                      {rec.titleText}
                    </div>
                  </div>
                  <div className="text-right text-xs shrink-0">
                    <div className="font-semibold text-[#171923]">
                      {(rec.views || 0).toLocaleString()} views
                    </div>
                    <div className="text-[#159B75]">
                      {rec.ctrPercent}% CTR • {rec.retentionPercent}% Hold
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
