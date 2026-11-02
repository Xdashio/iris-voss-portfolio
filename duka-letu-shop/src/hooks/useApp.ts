"use client";

import { useEffect } from "react";
import { currentStaff, ensureLoaded, useSnapshot } from "@/lib/store";

export function useApp() {
  const snap = useSnapshot();
  useEffect(() => { ensureLoaded(); }, []);
  return snap;
}

export function useStaff() {
  const snap = useApp();
  return { snap, staff: currentStaff(snap) };
}
