"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Compass,
  Scissors,
  Send,
  Play,
  Wand2,
} from "lucide-react";
import { VyralLogo } from "@/components/VyralLogo";
import { NavSectionId } from "@/lib/types";

interface WelcomeExperienceProps {
  creatorName?: string;
  onComplete: (destination: NavSectionId) => void;
}

const STEPS = [
  {
    number: "01",
    title: "Discover",
    description: "Find videos and emerging content opportunities.",
    icon: Compass,
    previewLabel: "Outlier Velocity • +340% Growth",
    accent: "from-[#7655E9]/10 to-[#4B9DF8]/10",
  },
  {
    number: "02",
    title: "Create",
    description: "Turn the best moments into professional clips.",
    icon: Scissors,
    previewLabel: "9:16 Speaker Reframing & Kinetic Captions",
    accent: "from-[#4B9DF8]/10 to-[#159B75]/10",
  },
  {
    number: "03",
    title: "Publish",
    description: "Optimize titles, captions and publishing packages.",
    icon: Send,
    previewLabel: "Shorts • Reels • TikTok • Long-Form",
    accent: "from-[#7655E9]/10 to-[#F2EEFF]",
  },
];

export function WelcomeExperience({
  creatorName = "Creator",
  onComplete,
}: WelcomeExperienceProps) {
  return (
    <div className="min-h-screen bg-[#FAFBFD] text-[#171923] relative overflow-hidden flex flex-col justify-between">
      {/* Subtle Ambient Light Gradient Accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 24, 0],
            y: [0, -18, 0],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[760px] h-[420px] rounded-full bg-gradient-to-tr from-[#F2EEFF] via-[#EBF4FF] to-transparent blur-3xl opacity-80"
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-10 max-w-6xl w-full mx-auto px-6 sm:px-10 pt-8 flex items-center justify-between">
        <VyralLogo size="md" showBadge={true} />
        <button
          onClick={() => onComplete("overview")}
          className="text-sm font-medium text-[#737B8C] hover:text-[#171923] transition-colors flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-white/80"
        >
          <span>Skip intro</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Editorial Hero & 3-Step Introduction */}
      <main className="relative z-10 max-w-5xl w-full mx-auto px-6 sm:px-10 py-14 md:py-20 space-y-16">
        {/* Hero Copy */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F2EEFF] border border-[#E4DCFF] text-[#7655E9] text-xs font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to VYRAL, {creatorName}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#171923] leading-[1.08]"
          >
            Your next viral moment{" "}
            <span className="bg-gradient-to-r from-[#7655E9] to-[#4B9DF8] bg-clip-text text-transparent">
              starts here.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="text-base sm:text-lg text-[#737B8C] max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Discover trending content, find the moments worth sharing, and turn
            long videos into professional short-form content with AI.
          </motion.p>

          {/* Primary & Secondary CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <button
              onClick={() => onComplete("create-clips")}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#7655E9] hover:bg-[#6644DF] text-white text-sm font-medium shadow-md shadow-[#7655E9]/20 hover:shadow-lg hover:shadow-[#7655E9]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              <span>Create your first clips</span>
            </button>

            <button
              onClick={() => onComplete("trending-now")}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-[#F5F7FA] text-[#171923] border border-[#E9ECF2] text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 text-[#7655E9]" />
              <span>Explore trending videos</span>
            </button>
          </motion.div>
        </div>

        {/* Three-Step Introduction Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="bg-white border border-[#E9ECF2] rounded-2xl p-7 flex flex-col justify-between gap-6 shadow-xs hover:border-[#D8D0F8] transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-medium text-[#7655E9] bg-[#F2EEFF] px-2.5 py-1 rounded-md">
                      {step.number} — {step.title}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#FAFBFD] border border-[#E9ECF2] flex items-center justify-center text-[#7655E9] group-hover:bg-[#F2EEFF] transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-[#171923]">
                    {step.number} — {step.title}
                  </h3>

                  <p className="text-sm text-[#737B8C] leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Minimalist Feature Illustration Pill */}
                <div
                  className={`rounded-xl bg-gradient-to-r ${step.accent} border border-[#E9ECF2]/80 px-3.5 py-2.5 flex items-center justify-between`}
                >
                  <span className="text-xs font-medium text-[#171923]">
                    {step.previewLabel}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#159B75]" />
                </div>
              </div>
            );
          })}
        </motion.div>
      </main>

      {/* Subtle Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto px-6 sm:px-10 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9CA3AF]">
        <span>VYRAL — The AI Operating System for Viral Content</span>
        <button
          onClick={() => onComplete("overview")}
          className="text-[#737B8C] hover:text-[#171923] font-medium cursor-pointer"
        >
          Continue directly to workspace →
        </button>
      </footer>
    </div>
  );
}
