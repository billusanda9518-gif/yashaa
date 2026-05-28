"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ModelViewerProps = {
  src: string;
  alt: string;
  iosSrc?: string;
};

type ARStatus = "idle" | "loading" | "ready" | "error";

type ModelViewerElement = HTMLElement & {
  canActivateAR?: boolean;
  activateAR?: () => Promise<void>;
};

const ASTRONAUT_MODEL_SRC = "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

function toAbsoluteAssetUrl(path: string) {
  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

export default function ARModelViewer({ src, alt, iosSrc }: ModelViewerProps) {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [arStatus, setArStatus] = useState<ARStatus>("loading");
  const [isLaunchingAr, setIsLaunchingAr] = useState(false);
  const [useTestModel, setUseTestModel] = useState(false);

  useEffect(() => {
    void import("@google/model-viewer");
  }, []);

  const effectiveSrc = useTestModel ? ASTRONAUT_MODEL_SRC : src;

  const resolvedIosSrc = useMemo(() => {
    if (useTestModel) {
      return undefined;
    }

    if (iosSrc) {
      return iosSrc;
    }

    if (!effectiveSrc.endsWith(".glb")) {
      return undefined;
    }

    return effectiveSrc.replace(/\.glb$/i, ".usdz");
  }, [effectiveSrc, iosSrc, useTestModel]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }

    setArStatus("loading");

    const onLoad = () => {
      setArStatus("ready");
      console.info("[AR] model loaded", {
        src: effectiveSrc,
        absoluteSrc: toAbsoluteAssetUrl(effectiveSrc),
      });
    };

    const onError = (event: Event) => {
      setArStatus("error");
      console.error("[AR] model failed to load", {
        src: effectiveSrc,
        absoluteSrc: toAbsoluteAssetUrl(effectiveSrc),
        event,
      });
    };

    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);

    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
    };
  }, [effectiveSrc]);

  const handleViewInAR = async () => {
    const viewer = viewerRef.current;
    if (!viewer) {
      console.error("[AR] model-viewer element not ready");
      return;
    }

    if (!viewer.canActivateAR) {
      console.warn("[AR] AR not supported on this device/browser", {
        userAgent: navigator.userAgent,
      });
      return;
    }

    try {
      setIsLaunchingAr(true);
      await viewer.activateAR?.();
    } catch (error) {
      console.error("[AR] Failed to launch AR session", error);
    } finally {
      setIsLaunchingAr(false);
    }
  };

  const quickLookHref = resolvedIosSrc ? toAbsoluteAssetUrl(resolvedIosSrc) : undefined;

  return (
    <div className="relative h-full min-h-[430px] w-full">
      <model-viewer
        ref={viewerRef}
        className="h-full min-h-[430px] w-full bg-[radial-gradient(circle_at_50%_10%,#fff7ed_0,#f4f7f2_42%,#dce6dc_100%)]"
        src={effectiveSrc}
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
        <button
          type="button"
          className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-[#26382c] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#f9f4e7] transition hover:opacity-90"
          onClick={handleViewInAR}
          disabled={isLaunchingAr || arStatus === "loading"}
        >
          {isLaunchingAr ? "Launching AR..." : "View in AR"}
        </button>
        {quickLookHref ? (
          <a
            className="pointer-events-auto inline-flex items-center justify-center rounded-full border border-[#26382c] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#26382c] transition hover:bg-[#f8f8f6]"
            rel="ar"
            href={quickLookHref}
          >
            Open in Quick Look
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => setUseTestModel((value) => !value)}
          className="pointer-events-auto inline-flex items-center justify-center rounded-full border border-[#d5d0c4] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#625d54] transition hover:bg-[#f8f8f6]"
        >
          {useTestModel ? "Use Dish Model" : "Use Astronaut Test Model"}
        </button>
      </div>

      <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/65 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
        {arStatus === "loading" ? "Loading model..." : null}
        {arStatus === "ready" ? "Model ready" : null}
        {arStatus === "error" ? "Model failed to load" : null}
      </div>
    </div>
  );
}
