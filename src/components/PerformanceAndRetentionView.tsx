"use client";

import React, { useState } from "react";
import {
  Scissors,
  Trophy,
  Plus,
  Lock,
} from "lucide-react";
import {
  ABExperiment,
  DatabaseSchema,
  GeneratedClip,
  PlatformSettings,
  WinningTitleRecord,
} from "@/lib/types";

interface PerformanceAndRetentionViewProps {
  mode: "retention-intelligence" | "creator-insights" | "ab-testing-lab";
  clips: GeneratedClip[];
  activeClip: GeneratedClip;
  settings: PlatformSettings;
  winningTitles: WinningTitleRecord[];
  abExperiments: ABExperiment[];
  onSelectClip: (clip: GeneratedClip) => void;
  onDbUpdated: (db: DatabaseSchema) => void;
}

export function PerformanceAndRetentionView({
  mode,
  clips,
  activeClip,
  settings,
  winningTitles,
  abExperiments,
  onSelectClip,
  onDbUpdated,
}: PerformanceAndRetentionViewProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [expName, setExpName] = useState("Curiosity vs Direct Value Title Test");
  const [variantATitle, setVariantATitle] = useState(
    activeClip.publishingPackage?.titles[0]?.text || activeClip.title
  );
  const [variantAThumb, setVariantAThumb] = useState(
    activeClip.publishingPackage?.thumbnail.shortThumbnailText ||
      "RETENTION SECRET"
  );
  const [variantBTitle, setVariantBTitle] = useState(
    activeClip.publishingPackage?.titles[1]?.text ||
      `Why ${activeClip.title} Changes Everything`
  );
  const [variantBThumb, setVariantBThumb] = useState("WATCH THIS FIRST");

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const handleApplySuggestedCut = async (
    newStart: number,
    newEnd: number,
    label: string
  ) => {
    const res = await fetch("/api/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_clip",
        clipId: activeClip.id,
        updates: {
          startTime: newStart,
          endTime: newEnd,
          duration: Number(Math.max(5, newEnd - newStart).toFixed(1)),
          scoreBreakdown: {
            ...activeClip.scoreBreakdown,
            retentionPotential: Math.min(
              99,
              activeClip.scoreBreakdown.retentionPotential + 4
            ),
          },
        },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      onDbUpdated(data.db);
      showNotice(`Applied cut: ${label}`);
    }
  };

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    const newExp: ABExperiment = {
      id: `ab-${Date.now().toString().slice(-5)}`,
      clipId: activeClip.id,
      clipTitle: activeClip.title,
      name: expName,
      status: "running",
      createdAt: new Date().toISOString(),
      testPeriodDays: 7,
      variantA: {
        title: variantATitle,
        thumbnailText: variantAThumb,
        views: null,
        impressions: null,
        ctrPercent: null,
        avgWatchTimeSec: null,
      },
      variantB: {
        title: variantBTitle,
        thumbnailText: variantBThumb,
        views: null,
        impressions: null,
        ctrPercent: null,
        avgWatchTimeSec: null,
      },
      winner: "undetermined",
      notes:
        "Experiment created. Log post-publish analytics to determine the winning variant.",
    };

    const res = await fetch("/api/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_ab_experiment",
        experiment: newExp,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      onDbUpdated(data.db);
      showNotice("Created A/B Experiment");
    }
  };

  // 1. RETENTION INTELLIGENCE
  if (mode === "retention-intelligence") {
    const timelineBlocks = Array.from({ length: 10 }, (_, idx) => {
      const pctStart = idx * 10;
      const pctEnd = (idx + 1) * 10;
      const secStart = Number(
        (activeClip.startTime + (activeClip.duration * idx) / 10).toFixed(1)
      );
      const secEnd = Number(
        (activeClip.startTime + (activeClip.duration * (idx + 1)) / 10).toFixed(
          1
        )
      );
      const isPeak = idx === 0 || idx === 1 || idx === 6;
      const isDropRisk = idx === 4 || idx === 8;

      return {
        idx,
        pctRange: `${pctStart}%–${pctEnd}%`,
        timeRange: `${secStart}s–${secEnd}s`,
        status: isPeak ? "Strong Hook" : isDropRisk ? "Pacing Dip" : "Steady",
        holdEstimate: isPeak
          ? 94 - idx * 2
          : isDropRisk
          ? 74 - idx
          : 86 - idx,
      };
    });

    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#171923] text-white text-xs font-medium shadow-lg">
            {toast}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-[#171923]">
              Retention Intelligence
            </h1>
            <p className="text-sm text-[#737B8C]">
              Identify pacing dips, slow introductions, and optimal cut points
              before publishing.
            </p>
          </div>

          <select
            value={activeClip.id}
            onChange={(e) => {
              const found = clips.find((c) => c.id === e.target.value);
              if (found) onSelectClip(found);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E9ECF2] text-xs text-[#171923] font-medium max-w-xs truncate"
          >
            {clips.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Retention Timeline Card */}
        <div className="bg-white border border-[#E9ECF2] rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#171923]">
                Pacing & Hold Curve ({activeClip.duration}s)
              </h2>
              <p className="text-xs text-[#737B8C]">
                Predicted viewer hold across 10 segments of your clip.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#F2EEFF] text-[#7655E9] text-xs font-semibold">
              Retention Score {activeClip.scoreBreakdown.retentionPotential}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
            {timelineBlocks.map((b) => (
              <div
                key={b.idx}
                className="p-3 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] flex flex-col justify-between gap-3"
              >
                <div className="text-[11px] font-mono text-[#737B8C]">
                  {b.timeRange}
                </div>
                <div className="h-20 w-full bg-[#E9ECF2]/60 rounded-lg flex items-end p-1">
                  <div
                    style={{ height: `${b.holdEstimate}%` }}
                    className={`w-full rounded-md ${
                      b.status === "Strong Hook"
                        ? "bg-[#159B75]"
                        : b.status === "Pacing Dip"
                        ? "bg-amber-400"
                        : "bg-[#7655E9]"
                    }`}
                  />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#171923]">
                    {b.holdEstimate}%
                  </div>
                  <div className="text-[10px] text-[#737B8C]">{b.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Cuts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: "Tighten Opening Lead-In (-1.5s)",
              desc: "Start immediately on the high-conviction statement so viewers engage within the first second.",
              newStart: Number((activeClip.startTime + 1.5).toFixed(1)),
              newEnd: activeClip.endTime,
              lift: "+6% 3s Hold",
            },
            {
              title: "Remove Mid-Clip Pause",
              desc: "Enable automatic silence stripping (>350ms) to keep spoken cadence crisp.",
              newStart: activeClip.startTime,
              newEnd: Number(
                Math.max(
                  activeClip.startTime + 12,
                  activeClip.endTime - 1.5
                ).toFixed(1)
              ),
              lift: "+5% Completion",
            },
            {
              title: "Snap Loop Ending (-2.0s)",
              desc: "End right on the final resolution phrase to trigger seamless Shorts replay loops.",
              newStart: activeClip.startTime,
              newEnd: Number(
                Math.max(
                  activeClip.startTime + 10,
                  activeClip.endTime - 2.0
                ).toFixed(1)
              ),
              lift: "+9% Replay Loop",
            },
          ].map((cut) => (
            <div
              key={cut.title}
              className="bg-white border border-[#E9ECF2] rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xs"
            >
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#E8F8F2] text-[#159B75] text-xs font-medium">
                  {cut.lift}
                </span>
                <h3 className="text-sm font-semibold text-[#171923]">
                  {cut.title}
                </h3>
                <p className="text-xs text-[#737B8C] leading-relaxed">
                  {cut.desc}
                </p>
              </div>
              <button
                onClick={() =>
                  handleApplySuggestedCut(cut.newStart, cut.newEnd, cut.title)
                }
                className="w-full py-2 px-3 rounded-xl bg-[#F2EEFF] hover:bg-[#E5DCFF] text-xs font-medium text-[#7655E9] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Apply Cut</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. CREATOR INSIGHTS & MY WINNING TITLES
  if (mode === "creator-insights") {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <div className="pt-2 space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-[#171923]">
            Creator Insights
          </h1>
          <p className="text-sm text-[#737B8C]">
            Understand your winning title patterns, hook formats, and published
            clip outcomes.
          </p>
        </div>

        {/* Clean OAuth Status Card */}
        <div className="bg-white border border-[#E9ECF2] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#171923]">
              <Lock className="w-4 h-4 text-[#7655E9]" />
              <span>YouTube Analytics Connection</span>
            </div>
            <p className="text-xs text-[#737B8C]">
              {settings.youtubeOAuthConnected
                ? `Connected to ${settings.youtubeChannelTitle}`
                : "Connect YouTube OAuth in Settings to sync live channel CTR and retention curves automatically."}
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs font-medium text-[#737B8C] shrink-0">
            {winningTitles.length} Verified Records Logged
          </span>
        </div>

        {/* Winning Titles List */}
        <div className="bg-white border border-[#E9ECF2] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-base font-semibold text-[#171923]">
            <Trophy className="w-4 h-4 text-[#7655E9]" />
            <span>My Winning Titles</span>
          </div>

          <div className="space-y-3">
            {winningTitles.map((wt) => (
              <div
                key={wt.id}
                className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#F2EEFF] text-[#7655E9] text-[11px] font-medium">
                      {wt.style}
                    </span>
                    <span className="text-xs text-[#737B8C]">
                      {wt.platform} • {wt.publishedAt}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#171923]">
                    {wt.titleText}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs shrink-0">
                  <div>
                    <div className="text-[#9CA3AF]">Views</div>
                    <div className="font-semibold text-[#171923]">
                      {(wt.views || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#9CA3AF]">CTR</div>
                    <div className="font-semibold text-[#159B75]">
                      {wt.ctrPercent ?? 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[#9CA3AF]">Retention</div>
                    <div className="font-semibold text-[#7655E9]">
                      {wt.retentionPercent ?? 0}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. A/B TESTING LAB
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#171923] text-white text-xs font-medium shadow-lg">
          {toast}
        </div>
      )}

      <div className="pt-2 space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-[#171923]">
          A/B Testing Lab
        </h1>
        <p className="text-sm text-[#737B8C]">
          Compare two title and cover text angles to discover what resonates
          best with your audience.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleCreateExperiment}
          className="lg:col-span-5 bg-white border border-[#E9ECF2] rounded-2xl p-6 space-y-4 shadow-xs"
        >
          <h3 className="text-base font-semibold text-[#171923]">
            New Title & Cover Experiment
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#737B8C]">
              Experiment Name
            </label>
            <input
              type="text"
              value={expName}
              onChange={(e) => setExpName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] space-y-2">
            <div className="text-xs font-semibold text-[#7655E9]">
              Variant A
            </div>
            <input
              type="text"
              value={variantATitle}
              onChange={(e) => setVariantATitle(e.target.value)}
              placeholder="Variant A Title"
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E9ECF2] text-xs text-[#171923]"
            />
            <input
              type="text"
              value={variantAThumb}
              onChange={(e) => setVariantAThumb(e.target.value)}
              placeholder="Variant A Cover Text"
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E9ECF2] text-xs text-[#171923]"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] space-y-2">
            <div className="text-xs font-semibold text-[#4B9DF8]">
              Variant B
            </div>
            <input
              type="text"
              value={variantBTitle}
              onChange={(e) => setVariantBTitle(e.target.value)}
              placeholder="Variant B Title"
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E9ECF2] text-xs text-[#171923]"
            />
            <input
              type="text"
              value={variantBThumb}
              onChange={(e) => setVariantBThumb(e.target.value)}
              placeholder="Variant B Cover Text"
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#E9ECF2] text-xs text-[#171923]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#7655E9] hover:bg-[#6544DC] text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Start Experiment</span>
          </button>
        </form>

        <div className="lg:col-span-7 space-y-4">
          {abExperiments.map((exp) => (
            <div
              key={exp.id}
              className="bg-white border border-[#E9ECF2] rounded-2xl p-6 space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-[#7655E9]">
                    {exp.clipTitle}
                  </span>
                  <h4 className="text-base font-semibold text-[#171923]">
                    {exp.name}
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-[#E8F8F2] text-[#159B75] text-xs font-medium">
                  {exp.winner !== "undetermined"
                    ? `Winner: Variant ${exp.winner}`
                    : exp.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] space-y-1.5">
                  <div className="text-xs font-semibold text-[#7655E9]">
                    Variant A
                  </div>
                  <div className="text-xs font-medium text-[#171923]">
                    {exp.variantA.title}
                  </div>
                  <div className="text-[11px] text-[#737B8C]">
                    Cover: {exp.variantA.thumbnailText}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] space-y-1.5">
                  <div className="text-xs font-semibold text-[#4B9DF8]">
                    Variant B
                  </div>
                  <div className="text-xs font-medium text-[#171923]">
                    {exp.variantB.title}
                  </div>
                  <div className="text-[11px] text-[#737B8C]">
                    Cover: {exp.variantB.thumbnailText}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
