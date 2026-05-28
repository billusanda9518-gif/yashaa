import type { CSSProperties, HTMLAttributes, Ref } from "react";

type ModelViewerElement = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  src?: string;
  "ios-src"?: string;
  alt?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "camera-controls"?: boolean;
  "auto-rotate"?: boolean;
  "shadow-intensity"?: string;
  exposure?: string;
  "camera-orbit"?: string;
  "field-of-view"?: string;
  "touch-action"?: string;
  style?: CSSProperties;
};

declare module "react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerElement;
    }
  }
}
