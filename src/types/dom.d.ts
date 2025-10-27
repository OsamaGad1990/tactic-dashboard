// src/types/dom.d.ts
export {};

declare global {
  interface HTMLInputElement {
    /** مدعومة في متصفحات WebKit الحديثة */
    showPicker?: () => void;
  }
}
