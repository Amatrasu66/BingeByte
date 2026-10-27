"use client";

import * as React from "react";
import { useState, useRef, useEffect, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GooeyInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  isLoading?: boolean;
}

export function GooeyInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Search movies, TV shows, anime...",
  className,
  autoFocus = false,
  isLoading = false,
}: GooeyInputProps) {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const filterId = useId().replace(/:/g, "-");

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onSubmit) {
      onSubmit(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      onChange("");
      inputRef.current?.blur();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
    inputRef.current?.focus();
  };

  const hasValue = value.trim().length > 0;

  return (
    <div className={cn("relative w-full max-w-2xl mx-auto", className)}>
      {/* SVG Gooey Filter Definition */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          <filter id={`gooey-${filterId}`}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Gooey Liquid Layer */}
      <div
        className="pointer-events-none absolute inset-0 -inset-x-2 -inset-y-1.5 overflow-visible"
        style={{ filter: `url(#gooey-${filterId})` }}
      >
        {/* Animated background gooey blob */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white/90"
          animate={{
            scale: isFocused ? [1, 1.02, 1] : isHovered ? 1.01 : 1,
            opacity: isFocused ? 1 : isHovered ? 0.95 : 0.9,
          }}
          transition={{
            duration: 0.4,
            ease: "easeInOut",
          }}
        />

        {/* Orbiting / morphing liquid droplets on focus or typing */}
        <AnimatePresence>
          {isFocused && (
            <>
              <motion.span
                className="absolute -top-1 left-8 h-4 w-4 rounded-full bg-white"
                initial={{ scale: 0, x: 0 }}
                animate={{
                  scale: [0, 1.2, 0.9, 1.1, 0],
                  x: [0, 15, 30, 45, 60],
                  y: [0, -3, 2, -2, 0],
                }}
                exit={{ scale: 0 }}
                transition={{
                  repeat: Infinity,
                  duration: 2.8,
                  ease: "easeInOut",
                }}
              />
              <motion.span
                className="absolute -bottom-1.5 right-12 h-5 w-5 rounded-full bg-white"
                initial={{ scale: 0, x: 0 }}
                animate={{
                  scale: [0, 1.3, 0.8, 1, 0],
                  x: [0, -20, -40, -60, -80],
                  y: [0, 3, -2, 2, 0],
                }}
                exit={{ scale: 0 }}
                transition={{
                  repeat: Infinity,
                  duration: 3.2,
                  ease: "easeInOut",
                  delay: 0.4,
                }}
              />
              <motion.span
                className="absolute top-1/2 -right-2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white"
                initial={{ scale: 0 }}
                animate={{
                  scale: [1, 1.4, 0.9, 1],
                  x: [0, 6, 2, 0],
                }}
                exit={{ scale: 0 }}
                transition={{
                  repeat: Infinity,
                  duration: 2.2,
                  ease: "easeInOut",
                }}
              />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Foreground Form & Controls */}
      <form
        onSubmit={handleSubmit}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative z-10 flex items-center h-14 sm:h-16 w-full rounded-full bg-white px-5 sm:px-6 shadow-2xl transition-all duration-300"
      >
        {/* Leading Search Icon */}
        <div className="flex shrink-0 items-center justify-center text-neutral-800 pr-3">
          {isLoading ? (
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-neutral-600" />
          ) : (
            <Search
              className={cn(
                "h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-200",
                isFocused ? "scale-110 text-black" : "text-neutral-600"
              )}
            />
          )}
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search movies, television shows, and entertainment catalog"
          className="w-full bg-transparent text-base sm:text-lg font-medium text-neutral-900 placeholder:text-neutral-500 focus:outline-hidden"
        />

        {/* Trailing Controls: Clear & Submit */}
        <div className="flex shrink-0 items-center gap-1.5 pl-2">
          {hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors focus-ring"
              aria-label="Clear search input"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <motion.button
            type="submit"
            disabled={!hasValue}
            whileHover={{ scale: hasValue ? 1.05 : 1 }}
            whileTap={{ scale: hasValue ? 0.95 : 1 }}
            className={cn(
              "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all duration-200 focus-ring",
              hasValue
                ? "bg-black text-white hover:bg-neutral-800 cursor-pointer shadow-md"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            )}
            aria-label="Execute search"
          >
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </motion.button>
        </div>
      </form>
    </div>
  );
}
