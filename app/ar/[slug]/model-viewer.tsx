"use client";

import { useEffect, useMemo } from "react";

type ModelViewerProps = {
  src: string;
  alt: string;
  iosSrc?: string;
};

function toAbsoluteAssetUrl(path: string) {
  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

function buildSceneViewerIntent(src: string, title: string) {
  if (typeof window === "undefined") {
    return "";
  }

  const file = encodeURIComponent(toAbsoluteAssetUrl(src));
  const fallback = encodeURIComponent(window.location.href);

  return `intent://arvr.google.com/scene-viewer/1.0?file=${file}&mode=ar_preferred&title=${encodeURIComponent(title)}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end;`;
}

export default function ARModelViewer({ src, alt, iosSrc }: ModelViewerProps) {
  useEffect(() => {
    void import("@google/model-viewer");
  }, []);

  const resolvedIosSrc = useMemo(() => {
    if (iosSrc) {
      return iosSrc;
    }

    if (!src.endsWith(".glb")) {
      return undefined;
    }

    return src.replace(/\.glb$/i, ".usdz");
  }, [iosSrc, src]);

  const quickLookHref = resolvedIosSrc ? toAbsoluteAssetUrl(resolvedIosSrc) : undefined;
  const sceneViewerHref = buildSceneViewerIntent(src, alt);

  return (
    <div className="relative h-full min-h-[430px] w-full">
      <model-viewer
        className="h-full min-h-[430px] w-full bg-[radial-gradient(circle_at_50%_10%,#fff7ed_0,#f4f7f2_42%,#dce6dc_100%)]"
        src={src}
        ios-src={resolvedIosSrc}
        alt={alt}
        ar
        ar-modes="scene-viewer quick-look webxr"
        camera-controls
        auto-rotate
        shadow-intensity="0.85"
        exposure="0.9"
        camera-orbit="35deg 68deg 2.4m"
        field-of-view="28deg"
        touch-action="pan-y"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-3 p-4">
        <a
          className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-[#26382c] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#f9f4e7] transition hover:opacity-90"
          href={sceneViewerHref}
        >
          Open in Scene Viewer
        </a>
        {quickLookHref ? (
          <a
            className="pointer-events-auto inline-flex items-center justify-center rounded-full border border-[#26382c] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#26382c] transition hover:bg-[#f8f8f6]"
            rel="ar"
            href={quickLookHref}
          >
            Open in Quick Look
          </a>
        ) : null}
      </div>
    </div>
  );
}
