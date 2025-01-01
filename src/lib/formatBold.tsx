import type { ReactNode } from "react";

/**
 * Converts *text* markers in a string into <strong> elements.
 * Returns a ReactNode array suitable for embedding in JSX.
 */
export function formatBold(text: string): ReactNode[] {
  const parts = text.split(/\*([^*]+)\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={`b-${part}`}>{part}</strong> : part));
}
