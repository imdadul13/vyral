"use client";

import React from "react";
import { motion } from "framer-motion";
import { VYRAL_BRAND } from "@/lib/brand";

interface VyralLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  showBadge?: boolean;
}

export function VyralLogo({
  size = "md",
  showTagline = false,
  showBadge = false,
}: VyralLogoProps) {
  const iconDim = size === "sm" ? "w-7 h-7" : size === "lg" ? "w-11 h-11" : "w-8 h-8";
  const textSize =
    size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-[15px]";

  return (
    <div className="flex items-center gap-2.5 select-none group">
      {/* Stylized Geometric V Emblem */}
      <motion.div
        whileHover={{ scale: 1.04 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className={`${iconDim} relative rounded-xl bg-gradient-to-br from-[#7655E9] to-[#4B9DF8] flex items-center justify-center shadow-sm shadow-[#7655E9]/20 overflow-hidden shrink-0`}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 relative z-10"
        >
          {/* Left precision wing of V */}
          <path
            d="M6.5 8.5L13.2 8.5L18 22.4L14.6 28.5L6.5 8.5Z"
            fill="#FFFFFF"
            fillOpacity="0.92"
          />
          {/* Right high-velocity ascending wing of V */}
          <path
            d="M29.5 8.5L22.8 8.5L16.2 27.5L19.6 29.5L29.5 8.5Z"
            fill="#FFFFFF"
          />
          {/* Spark apex dot */}
          <circle cx="18" cy="7.5" r="2" fill="#E0F2FE" />
        </svg>
      </motion.div>

      {/* Geometric Wordmark */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold tracking-[0.12em] text-[#171923] ${textSize} leading-none`}
          >
            {VYRAL_BRAND.name}
          </span>
          {showBadge && (
            <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-[#F2EEFF] text-[#7655E9]">
              AI
            </span>
          )}
        </div>
        {showTagline && (
          <p className="text-[11px] text-[#737B8C] tracking-tight truncate mt-0.5">
            {VYRAL_BRAND.primaryTagline}
          </p>
        )}
      </div>
    </div>
  );
}
