"use client";

import React from "react";
import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textSize?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 36,
  className = "",
  showText = false,
  textSize = "text-lg",
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div 
        className="relative shrink-0 overflow-hidden rounded-xl shadow-lg shadow-purple-500/20 border border-purple-500/30"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logo.png"
          alt="HackForge Logo"
          width={size}
          height={size}
          className="object-cover w-full h-full rounded-xl"
          priority
        />
      </div>

      {showText && (
        <span className={`font-heading font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent ${textSize}`}>
          HackForge
        </span>
      )}
    </div>
  );
};
