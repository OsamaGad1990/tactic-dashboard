// src/components/AppScreen.tsx
"use client";
import type React from "react";

type Props = {
  title?: string;
  children: React.ReactNode;
  /** مرّر له dirStyle + padding */
  contentContainerStyle?: React.CSSProperties;
  className?: string;
};

export default function AppScreen({ title, children, contentContainerStyle, className }: Props) {
  return (
    <div className={className ?? ""}>
      {title ? <h1 className="sr-only">{title}</h1> : null}
      <div style={contentContainerStyle} className="max-w-[1200px] mx-auto">
        {children}
      </div>
    </div>
  );
}
