"use client";

import { useEffect, type ReactNode } from "react";
import { ensureLoaded, useSnapshot } from "@/lib/store";
import { ToastProvider, useToast } from "./shared/toast";

function StorageWatcher() {
  const snap = useSnapshot();
  const { toast } = useToast();
  const err = snap?.storageError;
  useEffect(() => { if (err) toast({ kind: "error", title: err }); }, [err, toast]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => { ensureLoaded(); }, []);
  return (
    <ToastProvider>
      <StorageWatcher />
      {children}
    </ToastProvider>
  );
}
