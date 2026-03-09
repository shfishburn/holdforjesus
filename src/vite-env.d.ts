/// <reference types="vite/client" />

declare global {
  var dataLayer: unknown[];
  var gtag: ((...args: unknown[]) => void) | undefined;
}

export {};
