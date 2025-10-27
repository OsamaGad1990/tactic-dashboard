"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { UserProvider } from "@/context/UserContext";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <UserProvider>{children}</UserProvider>
    </ToastProvider>
  );
}
