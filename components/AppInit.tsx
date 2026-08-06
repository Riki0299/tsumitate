"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export default function AppInit() {
  const load = useAppStore((s) => s.load);
  const loaded = useAppStore((s) => s.loaded);

  useEffect(() => {
    if (!loaded) {
      load();
    }
  }, [loaded, load]);

  return null;
}
