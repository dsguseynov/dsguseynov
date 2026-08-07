import { useEffect } from "react";

const listeners = new Set<() => void>();

export function emitDataChanged() {
  for (const listener of listeners) listener();
}

export function useDataChanged(callback: () => void) {
  useEffect(() => {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }, [callback]);
}
