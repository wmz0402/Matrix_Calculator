/// <reference types="vite/client" />

interface MathJaxApi {
  typesetClear?(elements?: HTMLElement[]): void;
  typesetPromise?(elements?: HTMLElement[]): Promise<void>;
}

interface Window {
  MathJax?: MathJaxApi;
}
