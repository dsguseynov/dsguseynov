"use client";

import { useEffect } from "react";

const EVENT_NAME = "app:data-changed";

export function emitDataChanged() {
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function useDataChanged(callback: () => void) {
  useEffect(() => {
    window.addEventListener(EVENT_NAME, callback);
    return () => window.removeEventListener(EVENT_NAME, callback);
  }, [callback]);
}
