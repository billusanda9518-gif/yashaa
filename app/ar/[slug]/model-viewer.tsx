"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ModelViewerProps = {
  src: string;
  alt: string;
  iosSrc?: string;
};

type ARStatus = "idle" | "loading" | "ready" | "error";

type ModelViewerElement = HTMLElement & {
  canActivateAR?: boolean;
};

const ASTRONAUT_MODEL_SRC = "/models/astronaut.glb";

function toAbsoluteAssetUrl(path: string) {
  if (typeof window === "undefined") {
    return path;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return new URL(path, window.location.origin).href;
}

function getArModesForDevice() {
  if (typeof window === "undefined") {
    return "scene-viewer";
  }

  const ua = navigator.userAgent;

  // iPhone/iPad: Quick Look only (needs USDZ).
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return "quick-look";
  }

  // Android: Scene Viewer only. WebXR first causes instant close on many devices.
  if (/Android/i.test(ua)) {
    return "scene-viewer";
  }

  return "scene-viewer webxr quick-look";
}

function buildSceneViewerUrl(modelUrl: string, title: string) {
  const params = new URLSearchParams({
    file: modelUrl,
    mode: "ar_preferred",
    title,
  });

  return `https://arvr.google.com/scene-viewer/1.0?${params.toString()}`;
}

export default function ARModelViewer({ src, alt, iosSrc }: ModelViewerProps) {
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [arStatus, setArStatus] = useState<ARStatus>("loading");
  const [arMessage, setArMessage] = useState<string>("");
  const [useTestModel, setUseTestModel] = useState(false);
  const [modelSrc, setModelSrc] = useState(src);
  const [iosModelSrc, setIosModelSrc] = useState<string | undefined>(undefined);
  const [arModes, setArModes] = useState("scene-viewer");
  const [sceneViewerUrl, setSceneViewerUrl] = useState("");

  const effectiveSrc = useTestModel ? ASTRONAUT_MODEL_SRC : src;

  const candidateIosSrc = useMemo(() => {
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
    void import("@google/model-viewer");
  }, []);

  useEffect(() => {
    const absoluteModelSrc = toAbsoluteAssetUrl(effectiveSrc);
    setModelSrc(absoluteModelSrc);
    setArModes(getArModesForDevice());
    setSceneViewerUrl(buildSceneViewerUrl(absoluteModelSrc, alt));
    setArStatus("loading");
    setArMessage("");
    setIosModelSrc(undefined);

    if (!candidateIosSrc) {
      return;
    }

    const absoluteIosSrc = toAbsoluteAssetUrl(candidateIosSrc);

    void fetch(absoluteIosSrc, { method: "HEAD" })
      .then((response) => {
        if (response.ok) {
          setIosModelSrc(absoluteIosSrc);
        }
      })
      .catch(() => {
        setIosModelSrc(undefined);
      });
  }, [alt, candidateIosSrc, effectiveSrc]);

  const attachViewerListeners = useCallback(
    (viewer: ModelViewerElement) => {
      const onLoad = () => {
        setArStatus("ready");
        setArMessage(
          viewer.canActivateAR
            ? "Tap the AR button on the model to open your camera."
            : "Model loaded. Use direct Scene Viewer link below.",
        );
        console.info("[AR] model loaded", {
          src: modelSrc,
          arModes,
          canActivateAR: viewer.canActivateAR,
        });
      };

      const onError = (event: Event) => {
        setArStatus("error");
        setArMessage("Model failed to load. Redeploy and verify /models CORS headers.");
        console.error("[AR] model failed to load", { src: modelSrc, event });
      };

      const onArStatus = (event: Event) => {
        const detail = (event as CustomEvent<{ status?: string }>).detail;
        console.info("[AR] ar-status", detail);

        if (detail?.status === "failed") {
          setArMessage(
            "Built-in AR failed. Tap “Open Scene Viewer (direct)” below. Also update Google app + Google Play Services for AR.",
          );
        }
      };

      viewer.addEventListener("load", onLoad);
      viewer.addEventListener("error", onError);
      viewer.addEventListener("ar-status", onArStatus as EventListener);

      return () => {
        viewer.removeEventListener("load", onLoad);
        viewer.removeEventListener("error", onError);
        viewer.removeEventListener("ar-status", onArStatus as EventListener);
      };
    },
    [arModes, modelSrc],
  );

  const setViewerRef = useCallback(
    (node: ModelViewerElement | null) => {
      viewerRef.current = node;
      if (!node) {
        return;
      }

      return attachViewerListeners(node);
    },
    [attachViewerListeners],
  );

  return (
      <div key={modelSrc} className="relative h-full min-h-[430px] w-full">
        <model-viewer
          ref={setViewerRef}
          className="h-full min-h-[430px] w-full bg-[radial-gradient(circle_at_50%_10%,#fff7ed_0,#f4f7f2_42%,#dce6dc_100%)]"
          src={modelSrc}
          {...(iosModelSrc ? { "ios-src": iosModelSrc } : {})}
          alt={alt}
          ar
          ar-modes={arModes}
          ar-scale="auto"
          ar-placement="floor"
          camera-controls
          auto-rotate
          shadow-intensity="0.85"
          exposure="0.9"
          camera-orbit="35deg 68deg 2.4m"
          field-of-view="28deg"
          touch-action="pan-y"
          loading="eager"
          reveal="auto"
          interaction-prompt="auto"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-3 px-4">
          <a
            href={sceneViewerUrl}
            className="pointer-events-auto inline-flex items-center justify-center rounded-full border border-[#26382c] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#26382c] transition hover:bg-[#f8f8f6]"
          >
            Open Scene Viewer (direct)
          </a>
          <button
            type="button"
            onClick={() => setUseTestModel((value) => !value)}
            className="pointer-events-auto inline-flex items-center justify-center rounded-full border border-[#d5d0c4] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#625d54] transition hover:bg-[#f8f8f6]"
          >
            {useTestModel ? "Use Dish Model" : "Use Astronaut Test Model"}
          </button>
        </div>

        <div className="pointer-events-none absolute left-4 top-4 max-w-[90%] space-y-2">
          <div className="rounded-full bg-black/65 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
            {arStatus === "loading" ? "Loading model..." : null}
            {arStatus === "ready" ? "Model ready" : null}
            {arStatus === "error" ? "Model failed to load" : null}
          </div>
          {arMessage ? (
            <p className="rounded-xl bg-black/65 px-3 py-2 text-xs leading-5 text-white">
              {arMessage}
            </p>
          ) : null}
        </div>
      </div>
  );
}
