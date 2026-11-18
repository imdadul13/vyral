"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Rocket,
  Download,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import {
  DatabaseSchema,
  GeneratedClip,
  NavSectionId,
} from "@/lib/types";
import { VYRAL_BRAND } from "@/lib/brand";
import { VyralLogo } from "@/components/VyralLogo";
import { WelcomeExperience } from "@/components/WelcomeExperience";
import { Sidebar } from "@/components/Sidebar";
import { OverviewDashboard } from "@/components/OverviewDashboard";
import { CreateClipsView } from "@/components/CreateClipsView";
import { SubtitleAndVideoStudio } from "@/components/SubtitleAndVideoStudio";
import { PublishingStudio } from "@/components/PublishingStudio";
import { TrendingAndRadarView } from "@/components/TrendingAndRadarView";
import {
  LibraryAndProjectsView,
  SocialExportModal,
} from "@/components/LibraryAndProjectsView";
import { AssistantAndAccountView } from "@/components/AssistantAndAccountView";
import { PerformanceAndRetentionView } from "@/components/PerformanceAndRetentionView";
import { PublishingWorkspaceView } from "@/components/PublishingWorkspaceView";

export default function VyralApp() {
  const [db, setDb] = useState<DatabaseSchema | null>(null);
  const [activeNav, setActiveNav] = useState<NavSectionId>("overview");
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [exportModalClip, setExportModalClip] = useState<GeneratedClip | null>(
    null
  );
  const [prefillYoutubeUrl, setPrefillYoutubeUrl] = useState<string | undefined>(
    undefined
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showWelcomeOverride, setShowWelcomeOverride] = useState<boolean | null>(
    null
  );

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    fetch("/api/state")
      .then((r) => r.json())
      .then((data: DatabaseSchema) => {
        setDb(data);
        if (data.clips?.[0]) {
          setActiveClipId(data.clips[0].id);
        }
      });
  }, []);

  if (!db) {
    return (
      <div className="min-h-screen bg-[#FAFBFD] flex flex-col items-center justify-center p-6 space-y-4">
        <VyralLogo size="lg" showTagline={false} showBadge={true} />
        <div className="text-xs font-medium text-[#737B8C] tracking-tight">
          Loading workspace...
        </div>
        <div className="w-48 h-1 rounded-full bg-[#E9ECF2] overflow-hidden">
          <div className="h-full w-2/3 bg-gradient-to-r from-[#7655E9] to-[#4B9DF8] animate-pulse rounded-full" />
        </div>
      </div>
    );
  }

  const isWelcomeVisible =
    showWelcomeOverride !== null
      ? showWelcomeOverride
      : !db.settings.onboardingCompleted;

  const handleCompleteOnboarding = async (destination: NavSectionId) => {
    setShowWelcomeOverride(false);
    setActiveNav(destination);
    try {
      const res = await fetch("/api/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_settings",
          settings: { onboardingCompleted: true },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.db) setDb(data.db);
      }
    } catch {
      // Non-blocking fallback
    }
  };

  if (isWelcomeVisible) {
    return (
      <WelcomeExperience
        creatorName={db.settings.creatorName || "Alex"}
        onComplete={handleCompleteOnboarding}
      />
    );
  }

  const activeClip =
    db.clips.find((c) => c.id === activeClipId) || db.clips[0];

  const handleOpenClipInStudio = (clip: GeneratedClip) => {
    setActiveClipId(clip.id);
    setActiveNav("subtitle-studio");
  };

  const handleOpenPublishingStudio = (clip: GeneratedClip) => {
    setActiveClipId(clip.id);
    setActiveNav("publishing-studio");
  };

  const handleGenerateFromTrending = (videoUrl: string) => {
    setPrefillYoutubeUrl(videoUrl);
    setActiveNav("create-clips");
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] text-[#171923] flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          activeNav={activeNav}
          onSelectNav={(id) => setActiveNav(id)}
          clipCount={db.clips.length}
          projectCount={db.projects.length}
          activeJobsCount={0}
          onQuickCreate={() => setActiveNav("create-clips")}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-[#171923]/30 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              className="relative z-10"
            >
              <Sidebar
                activeNav={activeNav}
                onSelectNav={(id) => {
                  setActiveNav(id);
                  setMobileMenuOpen(false);
                }}
                onQuickCreate={() => {
                  setActiveNav("create-clips");
                  setMobileMenuOpen(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimal Light Workspace Header */}
        <header className="h-14 border-b border-[#E9ECF2] bg-white/85 backdrop-blur-md sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#FAFBFD] border border-[#E9ECF2] text-[#737B8C]"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#737B8C] font-medium">
                {VYRAL_BRAND.name}
              </span>
              <span className="text-[#E9ECF2]">/</span>
              <span className="text-[#171923] font-medium capitalize">
                {activeNav.replace(/-/g, " ")}
              </span>
            </div>
          </div>

          {/* Right Subtle Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWelcomeOverride(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#737B8C] hover:text-[#171923] hover:bg-[#FAFBFD] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#7655E9]" />
              <span>Welcome</span>
            </button>

            <button
              onClick={() => setActiveNav("ai-assistant")}
              className="px-3 py-1.5 rounded-lg bg-[#FAFBFD] hover:bg-[#F2EEFF] border border-[#E9ECF2] text-xs text-[#737B8C] hover:text-[#7655E9] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-[#7655E9]" />
              <span className="hidden md:inline">AI Assistant</span>
            </button>

            <button
              onClick={() => setActiveNav("publishing-studio")}
              className="px-3 py-1.5 rounded-lg bg-[#F2EEFF] hover:bg-[#E6DEFF] text-xs text-[#7655E9] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Publishing Studio</span>
            </button>

            {activeClip && (
              <button
                onClick={() => setExportModalClip(activeClip)}
                className="px-3.5 py-1.5 rounded-lg bg-[#171923] hover:bg-[#2A2E3D] text-xs font-medium text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 px-4 sm:px-6 md:px-10 pt-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNav}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {activeNav === "overview" && (
                <OverviewDashboard
                  projects={db.projects}
                  clips={db.clips}
                  jobs={db.jobs}
                  trendingVideos={db.trendingVideos}
                  creatorName={db.settings.creatorName || "Alex"}
                  onNavigate={(nav) => setActiveNav(nav)}
                  onOpenClipInStudio={handleOpenClipInStudio}
                  onOpenPublishingStudio={handleOpenPublishingStudio}
                  onOpenExportModal={(clip) => setExportModalClip(clip)}
                  onGenerateFromTrending={handleGenerateFromTrending}
                />
              )}

              {activeNav === "create-clips" && (
                <CreateClipsView
                  key={prefillYoutubeUrl || "default-create"}
                  initialUrl={prefillYoutubeUrl}
                  onAnalysisComplete={({ clips, db: nextDb }) => {
                    setDb(nextDb);
                    if (clips[0]) setActiveClipId(clips[0].id);
                  }}
                  onOpenClipInStudio={handleOpenClipInStudio}
                  onOpenPublishingStudio={handleOpenPublishingStudio}
                  onOpenExportModal={(clip) => setExportModalClip(clip)}
                />
              )}

              {(activeNav === "subtitle-studio" ||
                activeNav === "clip-intelligence" ||
                activeNav === "video-editor") &&
                activeClip && (
                  <SubtitleAndVideoStudio
                    key={`${activeClip.id}-${activeNav}`}
                    studioMode={activeNav}
                    clips={db.clips}
                    activeClip={activeClip}
                    onSelectClip={(c) => setActiveClipId(c.id)}
                    onClipUpdated={(updatedClip, nextDb) => {
                      setDb(nextDb);
                      setActiveClipId(updatedClip.id);
                    }}
                    onOpenPublishingStudio={handleOpenPublishingStudio}
                    onOpenExportModal={(clip) => setExportModalClip(clip)}
                  />
                )}

              {activeNav === "publishing-studio" && activeClip && (
                <PublishingStudio
                  key={activeClip.id}
                  clips={db.clips}
                  projects={db.projects}
                  activeClip={activeClip}
                  winningTitles={db.winningTitles}
                  onSelectClip={(c) => setActiveClipId(c.id)}
                  onPackageUpdated={(updatedClip, nextDb) => {
                    setDb(nextDb);
                    setActiveClipId(updatedClip.id);
                  }}
                  onOpenSubtitleStudio={handleOpenClipInStudio}
                  onOpenExportModal={(clip) => setExportModalClip(clip)}
                />
              )}

              {(activeNav === "trending-now" ||
                activeNav === "opportunity-radar") && (
                <TrendingAndRadarView
                  mode={activeNav}
                  trendingVideos={db.trendingVideos}
                  viralRadar={db.viralRadar}
                  clips={db.clips}
                  onGenerateFromUrl={handleGenerateFromTrending}
                  onOpenPublishingStudio={() =>
                    setActiveNav("publishing-studio")
                  }
                  onSnapshotUpdated={(nextDb) => setDb(nextDb)}
                />
              )}

              {(activeNav === "retention-intelligence" ||
                activeNav === "creator-insights" ||
                activeNav === "ab-testing-lab") &&
                activeClip && (
                  <PerformanceAndRetentionView
                    mode={activeNav}
                    clips={db.clips}
                    activeClip={activeClip}
                    settings={db.settings}
                    winningTitles={db.winningTitles || []}
                    abExperiments={db.abExperiments || []}
                    onSelectClip={(c) => setActiveClipId(c.id)}
                    onDbUpdated={(nextDb) => setDb(nextDb)}
                  />
                )}

              {(activeNav === "content-calendar" ||
                activeNav === "publishing-queue" ||
                activeNav === "performance-tracker") && (
                <PublishingWorkspaceView
                  mode={activeNav}
                  state={db}
                  activeClip={activeClip || null}
                  onSelectClip={(clipId) => setActiveClipId(clipId)}
                  onNavigate={(section) => setActiveNav(section)}
                  onRefreshState={(nextDb) => setDb(nextDb)}
                  onNotify={notify}
                />
              )}

              {(activeNav === "clip-library" ||
                activeNav === "my-projects") && (
                <LibraryAndProjectsView
                  mode={activeNav}
                  projects={db.projects}
                  clips={db.clips}
                  settings={db.settings}
                  onOpenClipInStudio={handleOpenClipInStudio}
                  onOpenPublishingStudio={handleOpenPublishingStudio}
                  onOpenExportModal={(clip) => setExportModalClip(clip)}
                  onDbUpdated={(nextDb) => setDb(nextDb)}
                />
              )}

              {(activeNav === "ai-assistant" ||
                activeNav === "brand-kit" ||
                activeNav === "settings" ||
                activeNav === "subscription" ||
                activeNav === "help-center") &&
                activeClip && (
                  <AssistantAndAccountView
                    mode={activeNav}
                    clips={db.clips}
                    activeClip={activeClip}
                    brandKit={db.brandKit}
                    brandProfiles={db.brandProfiles}
                    settings={db.settings}
                    onSelectClip={(c) => setActiveClipId(c.id)}
                    onDbUpdated={(nextDb) => setDb(nextDb)}
                    onLaunchWelcomeTour={() => setShowWelcomeOverride(true)}
                  />
                )}
            </motion.div>
          </AnimatePresence>
        </main>

        {toastMsg && (
          <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#171923] text-white text-xs font-medium shadow-lg">
            {toastMsg}
          </div>
        )}
      </div>

      {/* Export & FFmpeg Server Render Modal */}
      {exportModalClip && (
        <SocialExportModal
          clip={exportModalClip}
          settings={db.settings}
          onClose={() => setExportModalClip(null)}
          onClipRendered={(updatedClip, nextDb) => {
            setDb(nextDb);
            setExportModalClip(updatedClip);
          }}
        />
      )}
    </div>
  );
}
