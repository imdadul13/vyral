"use client";

import React, { useEffect, useState } from "react";
import {
  Send,
  Sparkles,
  Check,
  Loader2,
  Cpu,
  KeyRound,
  Video as Youtube,
  Database,
  RotateCcw,
  Activity,
  AlertCircle,
  HardDrive,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  BrandKitConfig,
  DatabaseSchema,
  GeneratedClip,
  PlatformSettings,
  SubtitlePresetId,
  SubtitleStyleConfig,
} from "@/lib/types";
import { SUBTITLE_PRESETS } from "@/lib/presets";
import { AssistantActionSuggestion } from "@/app/api/assistant/route";
import type {
  IntegrationStatusLabel,
  IntegrationTestResult,
} from "@/app/api/integrations/test/route";

interface AssistantAndAccountViewProps {
  mode:
    | "ai-assistant"
    | "brand-kit"
    | "settings"
    | "subscription"
    | "help-center";
  clips: GeneratedClip[];
  activeClip: GeneratedClip;
  brandKit: BrandKitConfig;
  brandProfiles?: BrandKitConfig[];
  settings: PlatformSettings;
  onSelectClip: (clip: GeneratedClip) => void;
  onDbUpdated: (db: DatabaseSchema) => void;
  onLaunchWelcomeTour?: () => void;
}

const ASSISTANT_PROMPTS = [
  "Which clip has the highest viral potential?",
  "Improve this hook.",
  "Generate five stronger titles.",
  "Make the captions more engaging.",
  "Find the most interesting moment.",
  "Suggest a better clip duration.",
  "Generate descriptions and hashtags.",
];

function getStatusBadgeClasses(statusLabel: IntegrationStatusLabel): string {
  switch (statusLabel) {
    case "Connected":
      return "bg-[#E8F8F2] text-[#159B75] border-[#B7EBCD]";
    case "Not configured":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Authentication failed":
    case "API unavailable":
    case "Quota exceeded":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Test not performed":
    default:
      return "bg-[#FAFBFD] text-[#737B8C] border-[#E9ECF2]";
  }
}

export function AssistantAndAccountView({
  mode,
  clips,
  activeClip,
  brandKit,
  brandProfiles = [],
  settings,
  onSelectClip,
  onDbUpdated,
  onLaunchWelcomeTour,
}: AssistantAndAccountViewProps) {
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      text: string;
      suggestions?: AssistantActionSuggestion[];
    }[]
  >([
    {
      role: "assistant",
      text: `Hello! I am your VYRAL AI Content Strategist. I have loaded "${activeClip?.title}" (Score ${activeClip?.viralScore}) and your library of ${clips.length} clips. Ask me anything below or pick a prompt.`,
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const [kitDraft, setKitDraft] = useState<BrandKitConfig>(brandKit);
  const [kitSaved, setKitSaved] = useState(false);

  // API & Infrastructure Connection Test Center state
  const [integrations, setIntegrations] = useState<IntegrationTestResult[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testingAll, setTestingAll] = useState(false);
  const [dbActionMessage, setDbActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "settings") return;
    fetch("/api/integrations/test")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.integrations)) {
          setIntegrations(data.integrations);
        }
      })
      .catch(() => {
        // Ignore initial load error
      });
  }, [mode]);

  const runIntegrationTest = async (id: IntegrationTestResult["id"]) => {
    setTestingId(id);
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId: id }),
      });
      const data = await res.json();
      if (Array.isArray(data.integrations)) {
        setIntegrations(data.integrations);
      } else if (data.result) {
        setIntegrations((prev) =>
          prev.map((item) => (item.id === id ? data.result : item))
        );
      }
    } finally {
      setTestingId(null);
    }
  };

  const runAllIntegrationTests = async () => {
    setTestingAll(true);
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId: "all" }),
      });
      const data = await res.json();
      if (Array.isArray(data.integrations)) {
        setIntegrations(data.integrations);
      }
    } finally {
      setTestingAll(false);
    }
  };

  const handleDbAction = async (action: "backup" | "reset_seed") => {
    setDbActionMessage("Processing database operation...");
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, label: "settings-ui" }),
      });
      const data = await res.json();
      if (data.db) {
        onDbUpdated(data.db);
      }
      if (action === "backup" && data.backup) {
        setDbActionMessage(
          `Backup saved: ${data.backup.fileName} (${Math.round(
            data.backup.sizeBytes / 1024
          )} KB)`
        );
      } else if (action === "reset_seed") {
        setDbActionMessage("Workspace database reset to initial verified seed.");
      }
      setTimeout(() => setDbActionMessage(null), 5000);
    } catch {
      setDbActionMessage("Database action failed.");
    }
  };

  const sendAssistantPrompt = async (promptText: string) => {
    if (!promptText.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: promptText }]);
    setInputPrompt("");
    setIsThinking(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          activeClipId: activeClip?.id,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "Analysis complete.",
          suggestions: data.suggestions || [],
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const applyAssistantSuggestion = async (s: AssistantActionSuggestion) => {
    const res = await fetch("/api/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_clip",
        clipId: s.clipId,
        updates: s.updates,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      onDbUpdated(data.db);
    }
  };

  const saveBrandKit = async () => {
    const res = await fetch("/api/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_brand_kit",
        brandKit: kitDraft,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      onDbUpdated(data.db);
      setKitSaved(true);
      setTimeout(() => setKitSaved(false), 2500);
    }
  };

  if (mode === "ai-assistant") {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-[#171923]">
              AI Content Assistant
            </h1>
            <p className="text-sm text-[#737B8C]">
              Refine hooks, titles, captions, and pacing grounded in your clip
              transcript.
            </p>
          </div>

          <select
            value={activeClip?.id}
            onChange={(e) => {
              const found = clips.find((c) => c.id === e.target.value);
              if (found) onSelectClip(found);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E9ECF2] text-xs text-[#171923] max-w-xs truncate"
          >
            {clips.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {ASSISTANT_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => sendAssistantPrompt(q)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F2EEFF] border border-[#E9ECF2] hover:border-[#D8D0F8] text-xs text-[#737B8C] hover:text-[#7655E9] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#7655E9]" />
              <span>{q}</span>
            </button>
          ))}
        </div>

        <div className="bg-white border border-[#E9ECF2] rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-[#F2EEFF] text-[#171923] ml-auto max-w-xl"
                    : "bg-[#FAFBFD] border border-[#E9ECF2] text-[#171923] max-w-3xl"
                }`}
              >
                <div>{m.text}</div>
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#E9ECF2]">
                    {m.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => applyAssistantSuggestion(s)}
                        className="px-3 py-1.5 rounded-lg bg-[#E8F8F2] text-[#159B75] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isThinking && (
              <div className="p-4 rounded-2xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#7655E9] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing clip transcript...</span>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendAssistantPrompt(inputPrompt);
            }}
            className="flex gap-2 pt-3 border-t border-[#E9ECF2]"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask anything about your clip's hook, titles, or pacing..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923] focus:bg-white focus:border-[#7655E9] focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#7655E9] hover:bg-[#6544DC] text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (mode === "brand-kit") {
    const profiles = brandProfiles.length > 0 ? brandProfiles : [brandKit];
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-[#171923]">
              Brand Kit
            </h1>
            <p className="text-sm text-[#737B8C]">
              Configure default typography, colors, camera framing, and
              watermarks for your workspace.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={kitDraft.id}
              onChange={(e) => {
                const found = profiles.find((p) => p.id === e.target.value);
                if (found) setKitDraft(found);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E9ECF2] text-xs font-medium text-[#171923]"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  Profile: {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={saveBrandKit}
              className="px-5 py-2.5 rounded-xl bg-[#7655E9] hover:bg-[#6544DC] text-white text-xs font-medium flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{kitSaved ? "Saved!" : "Save Profile"}</span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#E9ECF2] rounded-2xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 shadow-xs">
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#737B8C]">
              Profile Name
            </label>
            <input
              type="text"
              value={kitDraft.name}
              onChange={(e) =>
                setKitDraft({ ...kitDraft, name: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[#737B8C]">
              Watermark Handle
            </label>
            <input
              type="text"
              value={kitDraft.watermarkText}
              onChange={(e) =>
                setKitDraft({ ...kitDraft, watermarkText: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[#737B8C]">
              Default Subtitle Style
            </label>
            <select
              value={kitDraft.defaultPresetId}
              onChange={(e) =>
                setKitDraft({
                  ...kitDraft,
                  defaultPresetId: e.target.value as SubtitlePresetId,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
            >
              {SUBTITLE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[#737B8C]">
              Default Font Family
            </label>
            <select
              value={kitDraft.defaultFont}
              onChange={(e) =>
                setKitDraft({
                  ...kitDraft,
                  defaultFont:
                    e.target.value as SubtitleStyleConfig["fontFamily"],
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
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

          <div className="space-y-2">
            <label className="text-xs font-medium text-[#737B8C]">
              Default Aspect Ratio
            </label>
            <select
              value={kitDraft.defaultAspectRatio || "9:16"}
              onChange={(e) =>
                setKitDraft({
                  ...kitDraft,
                  defaultAspectRatio:
                    e.target.value as BrandKitConfig["defaultAspectRatio"],
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] text-xs text-[#171923]"
            >
              <option value="9:16">9:16 Vertical Shorts</option>
              <option value="16:9">16:9 Landscape</option>
              <option value="1:1">1:1 Square</option>
              <option value="4:5">4:5 Portrait</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[#737B8C]">
              Primary Brand Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={kitDraft.primaryColor}
                onChange={(e) =>
                  setKitDraft({ ...kitDraft, primaryColor: e.target.value })
                }
                className="w-9 h-9 rounded border border-[#E9ECF2] cursor-pointer"
              />
              <span className="text-xs font-mono text-[#737B8C]">
                {kitDraft.primaryColor}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "subscription") {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="pt-2 space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-[#171923]">
            Subscription
          </h1>
          <p className="text-sm text-[#737B8C]">
            Manage your creator plan and rendering compute quota.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Starter",
              price: "$29/mo",
              desc: "For solo creators publishing daily shorts.",
              features: [
                "300 minutes video analysis / mo",
                "1080p 60FPS FFmpeg exports",
                "All 9 kinetic subtitle presets",
              ],
              current: false,
            },
            {
              name: "VYRAL Pro",
              price: "$79/mo",
              desc: "Active Plan • Full AI Intelligence & 4K Rendering",
              features: [
                "1,500 minutes video analysis / mo",
                "4K 60FPS hardware-accelerated rendering",
                "Opportunity Radar & Publishing Studio",
                "Multilingual subtitle translation",
              ],
              current: true,
            },
            {
              name: "Agency",
              price: "$249/mo",
              desc: "Multi-channel workflows & team collaboration.",
              features: [
                "6,000 minutes analysis + priority queue",
                "Multi-brand profile management",
                "Direct YouTube OAuth publishing",
              ],
              current: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border flex flex-col justify-between gap-6 bg-white shadow-xs ${
                plan.current ? "border-[#7655E9]" : "border-[#E9ECF2]"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-[#171923]">
                    {plan.name}
                  </span>
                  {plan.current && (
                    <span className="px-2.5 py-0.5 rounded-md bg-[#F2EEFF] text-[#7655E9] text-[11px] font-medium">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-2xl font-semibold text-[#171923]">
                  {plan.price}
                </div>
                <p className="text-xs text-[#737B8C]">{plan.desc}</p>
                <ul className="space-y-2 pt-2 text-xs text-[#171923]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#159B75] shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                className={`w-full py-2.5 rounded-xl text-xs font-medium ${
                  plan.current
                    ? "bg-[#7655E9] text-white"
                    : "bg-[#FAFBFD] border border-[#E9ECF2] text-[#171923]"
                }`}
              >
                {plan.current ? "Current Plan" : "Switch Plan"}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Settings (API & INFRASTRUCTURE Test Center) & Help Center
  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7655E9]">
            {mode === "settings" ? "API & INFRASTRUCTURE" : "DOCUMENTATION"}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#171923]">
            {mode === "settings"
              ? "Local API Connection Test Center"
              : "Help Center"}
          </h1>
          <p className="text-sm text-[#737B8C]">
            {mode === "settings"
              ? "Verify real backend connectivity, response latency, and configuration state across all 12 VYRAL infrastructure services."
              : "Learn how VYRAL analyzes long-form videos and builds publishing kits."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {mode === "settings" && (
            <>
              <button
                onClick={() => handleDbAction("backup")}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FAFBFD] border border-[#E9ECF2] text-xs font-medium text-[#171923] flex items-center gap-1.5 cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5 text-[#4B9DF8]" />
                <span>Backup DB</span>
              </button>
              <button
                onClick={() => handleDbAction("reset_seed")}
                className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FAFBFD] border border-[#E9ECF2] text-xs font-medium text-[#737B8C] hover:text-[#171923] flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Seed</span>
              </button>
              <button
                onClick={runAllIntegrationTests}
                disabled={testingAll}
                className="px-4 py-2.5 rounded-xl bg-[#7655E9] hover:bg-[#6544DC] disabled:opacity-60 text-white text-xs font-medium flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {testingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Activity className="w-3.5 h-3.5" />
                )}
                <span>
                  {testingAll
                    ? "Testing All 12 Services..."
                    : "Test All 12 Connections"}
                </span>
              </button>
            </>
          )}

          {onLaunchWelcomeTour && (
            <button
              onClick={onLaunchWelcomeTour}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F2EEFF] border border-[#E9ECF2] text-xs font-medium text-[#7655E9] flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Welcome Tour</span>
            </button>
          )}
        </div>
      </div>

      {dbActionMessage && (
        <div className="p-3.5 rounded-xl bg-[#E8F8F2] border border-[#B7EBCD] text-xs font-medium text-[#159B75] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{dbActionMessage}</span>
        </div>
      )}

      {mode === "settings" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {integrations.map((card, index) => {
            const isTesting = testingId === card.id || testingAll;
            return (
              <div
                key={card.id}
                className="p-5 rounded-2xl bg-white border border-[#E9ECF2] flex flex-col justify-between gap-4 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-medium text-[#737B8C]">
                        #{index + 1} • {card.category}
                      </div>
                      <h3 className="text-sm font-semibold text-[#171923] mt-0.5">
                        {card.name}
                      </h3>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-md border text-[11px] font-medium shrink-0 ${getStatusBadgeClasses(
                        card.statusLabel
                      )}`}
                    >
                      {card.statusLabel}
                    </span>
                  </div>

                  <p className="text-xs text-[#737B8C] leading-relaxed">
                    {card.details}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E9ECF2] text-[11px]">
                    <div className="bg-[#FAFBFD] rounded-lg px-2.5 py-1.5 border border-[#E9ECF2]">
                      <div className="text-[#9CA3AF]">Credentials</div>
                      <div
                        className={`font-medium mt-0.5 ${
                          card.configured ? "text-[#159B75]" : "text-amber-600"
                        }`}
                      >
                        {card.configured ? "Configured" : "Missing"}
                      </div>
                    </div>

                    <div className="bg-[#FAFBFD] rounded-lg px-2.5 py-1.5 border border-[#E9ECF2]">
                      <div className="text-[#9CA3AF]">Connection</div>
                      <div
                        className={`font-medium mt-0.5 ${
                          card.connected ? "text-[#159B75]" : "text-[#737B8C]"
                        }`}
                      >
                        {card.connected ? "Connected" : "Disconnected"}
                      </div>
                    </div>

                    <div className="bg-[#FAFBFD] rounded-lg px-2.5 py-1.5 border border-[#E9ECF2]">
                      <div className="text-[#9CA3AF]">Response time</div>
                      <div className="font-mono font-medium text-[#171923] mt-0.5">
                        {card.responseTimeMs !== null
                          ? `${card.responseTimeMs} ms`
                          : "—"}
                      </div>
                    </div>

                    <div className="bg-[#FAFBFD] rounded-lg px-2.5 py-1.5 border border-[#E9ECF2]">
                      <div className="text-[#9CA3AF]">Last tested</div>
                      <div className="font-medium text-[#171923] mt-0.5 truncate">
                        {card.lastTested
                          ? new Date(card.lastTested).toLocaleTimeString()
                          : "Not tested"}
                      </div>
                    </div>
                  </div>

                  {card.errorDetails && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5 leading-relaxed">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{card.errorDetails}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#E9ECF2] flex items-center justify-between gap-2">
                  <div className="text-[10px] font-mono text-[#9CA3AF] truncate">
                    {card.envKeysRequired.length > 0
                      ? card.envKeysRequired.join(", ")
                      : "Public HTTP Endpoint"}
                  </div>
                  <button
                    onClick={() => runIntegrationTest(card.id)}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-xl bg-[#FAFBFD] hover:bg-[#F2EEFF] border border-[#E9ECF2] hover:border-[#D8D0F8] text-xs font-medium text-[#171923] hover:text-[#7655E9] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {isTesting ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[#7655E9]" />
                    ) : (
                      <RefreshCw className="w-3 h-3 text-[#7655E9]" />
                    )}
                    <span>Test Connection</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-6 rounded-2xl bg-white border border-[#E9ECF2] space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#171923]">
                <Cpu className="w-4 h-4 text-[#159B75]" />
                <span>FFmpeg 9.0 Video Engine</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#E8F8F2] text-[#159B75] text-xs font-medium">
                Connected
              </span>
            </div>
            <p className="text-xs text-[#737B8C] leading-relaxed">
              {settings.hardwareAcceleration}. Handles real-time video trimming,
              9:16 speaker framing, subtitle rendering, and audio normalization.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E9ECF2] space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#171923]">
                <Youtube className="w-4 h-4 text-rose-500" />
                <span>YouTube Data API v3 & oEmbed</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#F2EEFF] text-[#7655E9] text-xs font-medium">
                {settings.youtubeApiKeyConfigured
                  ? "API Key Active"
                  : "oEmbed + Snapshot Mode"}
              </span>
            </div>
            <p className="text-xs text-[#737B8C] leading-relaxed">
              Configure <code className="text-[#7655E9]">YOUTUBE_API_KEY</code>{" "}
              in <code className="text-[#7655E9]">.env.local</code> for
              authenticated channel uploads and extended quota.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E9ECF2] space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#171923]">
                <KeyRound className="w-4 h-4 text-[#7655E9]" />
                <span>Gemini 3.8 Flash & Gemini 4 Argon</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#F2EEFF] text-[#7655E9] text-xs font-medium">
                {settings.geminiApiKeyConfigured
                  ? "Gemini Connected"
                  : "Local NLP Scorer Active"}
              </span>
            </div>
            <p className="text-xs text-[#737B8C] leading-relaxed">
              Configure <code className="text-[#7655E9]">GEMINI_API_KEY</code>{" "}
              in <code className="text-[#7655E9]">.env.local</code> to activate
              live <code className="text-[#7655E9]">gemini-3.8-flash</code> and{" "}
              <code className="text-[#7655E9]">gemini-4-argon</code> inference.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E9ECF2] space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-[#171923]">
                <Database className="w-4 h-4 text-[#4B9DF8]" />
                <span>Workspace Persistence</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#E8F8F2] text-[#159B75] text-xs font-medium">
                Active
              </span>
            </div>
            <p className="text-xs text-[#737B8C] leading-relaxed">
              Projects, clips, publishing kits, and onboarding state persist
              automatically to the local atomic database repository.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
