"use client";

import React, { useState } from "react";
import {
  LayoutGrid,
  PlusCircle,
  FolderOpen,
  Film,
  Sparkles,
  Subtitles,
  Scissors,
  Rocket,
  Palette,
  Flame,
  Radar,
  Activity,
  BarChart3,
  FlaskConical,
  Calendar,
  Send,
  TrendingUp,
  Settings,
  CreditCard,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { NavSectionId } from "@/lib/types";
import { VyralLogo } from "@/components/VyralLogo";

interface SidebarProps {
  activeNav: NavSectionId;
  onSelectNav: (id: NavSectionId) => void;
  clipCount?: number;
  projectCount?: number;
  activeJobsCount?: number;
  onQuickCreate: () => void;
}

interface NavGroupConfig {
  id: string;
  label: string;
  items: {
    id: NavSectionId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const NAV_GROUPS: NavGroupConfig[] = [
  {
    id: "workspace",
    label: "WORKSPACE",
    items: [
      { id: "overview", label: "Overview", icon: LayoutGrid },
      { id: "create-clips", label: "Create Clips", icon: PlusCircle },
      { id: "my-projects", label: "My Projects", icon: FolderOpen },
      { id: "clip-library", label: "Clip Library", icon: Film },
    ],
  },
  {
    id: "create",
    label: "CREATE",
    items: [
      { id: "clip-intelligence", label: "Clip Intelligence", icon: Sparkles },
      { id: "subtitle-studio", label: "Subtitle Studio", icon: Subtitles },
      { id: "video-editor", label: "Video Editor", icon: Scissors },
      { id: "publishing-studio", label: "Publishing Studio", icon: Rocket },
      { id: "brand-kit", label: "Brand Kit", icon: Palette },
    ],
  },
  {
    id: "discover",
    label: "DISCOVER",
    items: [
      { id: "trending-now", label: "Trending Now", icon: Flame },
      { id: "opportunity-radar", label: "Opportunity Radar", icon: Radar },
      { id: "retention-intelligence", label: "Retention Intelligence", icon: Activity },
      { id: "creator-insights", label: "Creator Insights", icon: BarChart3 },
      { id: "ab-testing-lab", label: "A/B Testing Lab", icon: FlaskConical },
    ],
  },
  {
    id: "publish",
    label: "PUBLISH",
    items: [
      { id: "content-calendar", label: "Content Calendar", icon: Calendar },
      { id: "publishing-queue", label: "Publishing Queue", icon: Send },
      { id: "performance-tracker", label: "Performance Tracker", icon: TrendingUp },
    ],
  },
];

const ACCOUNT_ITEMS: {
  id: NavSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "help-center", label: "Help Center", icon: HelpCircle },
];

export function Sidebar({
  activeNav,
  onSelectNav,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-60"
      } shrink-0 bg-white border-r border-[#E9ECF2] flex flex-col justify-between min-h-screen select-none sticky top-0 z-30 transition-all duration-200`}
    >
      {/* Top Brand Header + Collapse Toggle */}
      <div className="p-4 flex flex-col gap-5">
        <div className="flex items-center justify-between px-1">
          <div
            onClick={() => onSelectNav("overview")}
            className="cursor-pointer overflow-hidden"
          >
            {collapsed ? (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7655E9] to-[#4B9DF8] flex items-center justify-center text-white font-bold text-xs">
                V
              </div>
            ) : (
              <VyralLogo size="sm" showTagline={false} showBadge={false} />
            )}
          </div>

          <button
            onClick={() => setCollapsed((prev) => !prev)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#171923] hover:bg-[#FAFBFD] transition-colors cursor-pointer"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="space-y-5 overflow-y-auto max-h-[calc(100vh-180px)] pr-0.5">
          {NAV_GROUPS.map((group) => (
            <div key={group.id} className="space-y-1">
              {!collapsed && (
                <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                  {group.label}
                </div>
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectNav(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center ${
                        collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2"
                      } rounded-xl text-[13px] transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#F2EEFF] text-[#7655E9] font-medium"
                          : "text-[#737B8C] hover:text-[#171923] hover:bg-[#FAFBFD] font-normal"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-[#7655E9]" : "text-[#9CA3AF]"
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Compact Account Links */}
      <div className="p-3 border-t border-[#E9ECF2] space-y-0.5">
        {ACCOUNT_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectNav(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                collapsed ? "justify-center px-0 py-2" : "gap-2.5 px-2.5 py-1.5"
              } rounded-lg text-xs transition-all cursor-pointer ${
                isActive
                  ? "bg-[#F2EEFF] text-[#7655E9] font-medium"
                  : "text-[#737B8C] hover:text-[#171923] hover:bg-[#FAFBFD]"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? "text-[#7655E9]" : "text-[#9CA3AF]"
                }`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
