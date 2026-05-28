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
  activateAR?: () => Promise<void>;
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

function getAndroidVersion() {
  if (typeof window === "undefined") {
    return 0;
  }

  const match = navigator.userAgent.match(/Android (\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function getDeviceProfile() {
  if (typeof window === "undefined") {
    return {
      isIOS: false,
      isAndroid: false,
      androidVersion: 0,
      arModes: "scene-viewer",
      preferWebXR: false,
    };
  }

  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const androidVersion = isAndroid ? getAndroidVersion() : 0;

  if (isIOS) {
    return {
      isIOS: true,
      isAndroid: false,
      androidVersion: 0,
      arModes: "quick-look",
      preferWebXR: false,
    };
  }

  if (isAndroid) {
    // Android 16 + Scene Viewer: known Google-app bug (camera opens then closes).
    // WebXR in Chrome keeps AR inside the browser and avoids Scene Viewer.
    const preferWebXR = androidVersion >= 16;

    return {
      isIOS: false,
      isAndroid: true,
      androidVersion,
      arModes: preferWebXR ? "webxr" : "webxr scene-viewer",
      preferWebXR,
    };
  }

  return {
    isIOS: false,
    isAndroid: false,
    androidVersion: 0,
    arModes: "scene-viewer webxr quick-look",
    preferWebXR: false,
  };
}

function buildSceneViewerUrl(
  modelUrl: string,
  title: string,
  mode: "ar_preferred" | "3d_preferred",
) {
  const params = new URLSearchParams({
    file: modelUrl,
    mode,
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
  const [sceneViewer3dUrl, setSceneViewer3dUrl] = useState("");
  const [isAndroid16Plus, setIsAndroid16Plus] = useState(false);
  const [isLaunchingAr, setIsLaunchingAr] = useState(false);

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
    const profile = getDeviceProfile();

    setModelSrc(absoluteModelSrc);
    setArModes(profile.arModes);
    setIsAndroid16Plus(profile.isAndroid && profile.androidVersion >= 16);
    setSceneViewer3dUrl(
      buildSceneViewerUrl(absoluteModelSrc, alt, "3d_preferred"),
    );
    setArStatus("loading");
    setArMessage(
      profile.preferWebXR
        ? "Android 16 detected: use “View in AR (Chrome)” — Scene Viewer may close instantly on this device."
        : "",
    );
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

  const handleViewInAR = async () => {
    const viewer = viewerRef.current;
    if (!viewer?.canActivateAR) {
      setArMessage(
        "WebXR AR unavailable. Update Chrome, install Google Play Services for AR, and allow camera permission.",
      );
      return;
    }

    try {
      setIsLaunchingAr(true);
      await viewer.activateAR?.();
    } catch (error) {
      console.error("[AR] WebXR launch failed", error);
      setArMessage(
        "WebXR failed to start. Update Chrome + Google Play Services for AR, then retry.",
      );
    } finally {
      setIsLaunchingAr(false);
    }
  };

  const attachViewerListeners = useCallback(
    (viewer: ModelViewerElement) => {
      const onLoad = () => {
        setArStatus("ready");
        if (!isAndroid16Plus) {
          setArMessage(
            viewer.canActivateAR
              ? "Tap “View in AR (Chrome)” or the AR button on the model."
              : "Model loaded. Try the Scene Viewer 3D link below.",
          );
        }
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
            "AR session ended. On Android 16, use “View in AR (Chrome)” instead of Scene Viewer.",
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
    [arModes, isAndroid16Plus, modelSrc],
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

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 px-4">
        <button
          type="button"
          onClick={handleViewInAR}
          disabled={isLaunchingAr || arStatus === "loading" || arStatus === "error"}
          className="pointer-events-auto inline-flex w-full max-w-xs items-center justify-center rounded-full bg-[#26382c] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#f9f4e7] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLaunchingAr ? "Starting AR..." : "View in AR (Chrome)"}
        </button>

        {!isAndroid16Plus ? (
          <a
            href={sceneViewer3dUrl}
            className="pointer-events-auto inline-flex w-full max-w-xs items-center justify-center rounded-full border border-[#26382c] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#26382c] transition hover:bg-[#f8f8f6]"
          >
            Scene Viewer (3D first)
          </a>
        ) : null}

        <button
          type="button"
          onClick={() => setUseTestModel((value) => !value)}
          className="pointer-events-auto inline-flex w-full max-w-xs items-center justify-center rounded-full border border-[#d5d0c4] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#625d54] transition hover:bg-[#f8f8f6]"
        >
          {useTestModel ? "Use Dish Model" : "Use Astronaut Test Model"}
        </button>
      </div>

      <div className="pointer-events-none absolute left-4 top-4 max-w-[92%] space-y-2">
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
