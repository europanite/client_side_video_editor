import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FC,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

type ExportState = "idle" | "exporting" | "done" | "error";

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const App: FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [engineState, setEngineState] = useState<ExportState>("idle");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [duration, setDuration] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);

  const [statusMessage, setStatusMessage] = useState<string>(
    "Load a video file to begin."
  );
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const [videoWidth, setVideoWidth] = useState<number | null>(null);
  const [videoHeight, setVideoHeight] = useState<number | null>(null);

  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [isDrawingCrop, setIsDrawingCrop] = useState(false);
  const cropStartRef = useRef<{ x: number; y: number } | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Handle file selection */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Clean up old URLs
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);

    setTrimStart(0);
    setTrimEnd(0);
    setDuration(0);
    setVideoWidth(null);
    setVideoHeight(null);
    setCropRect(null);
    setIsDrawingCrop(false);
    setEngineState("idle");
    setStatusMessage("Video loaded. Waiting for metadata...");
  };

  /** When the video metadata is loaded, we know duration and dimensions */
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const d = videoRef.current.duration;
    if (!Number.isFinite(d) || d <= 0) {
      setStatusMessage("Could not read video duration.");
      return;
    }

    const vw = videoRef.current.videoWidth || null;
    const vh = videoRef.current.videoHeight || null;

    setDuration(d);
    setTrimStart(0);
    setTrimEnd(d);
    setVideoWidth(vw);
    setVideoHeight(vh);
    setCropRect(null);
    setIsDrawingCrop(false);
    setStatusMessage(
      "Ready to edit. Set the trim range, drag on the preview to select a crop, then export."
    );
  };

  /** Helper: format seconds to mm:ss */
  const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const r = s % 60;
    const mm = m.toString().padStart(2, "0");
    const ss = r.toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  /** Unified slider: change handlers (keep start <= end) */
  const handleTrimStartChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (duration <= 0) return;
    let value = Number(event.target.value);
    if (!Number.isFinite(value)) return;

    value = Math.max(0, Math.min(value, duration));
    if (value > trimEnd) {
      value = trimEnd;
    }
    setTrimStart(value);
  };

  const handleTrimEndChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (duration <= 0) return;
    let value = Number(event.target.value);
    if (!Number.isFinite(value)) return;

    value = Math.max(0, Math.min(value, duration));
    if (value < trimStart) {
      value = trimStart;
    }
    setTrimEnd(value);
  };

  /** Pointer helpers for crop selection (drag rectangle on preview) */
  const normalizePointerToVideo = (
    event: ReactPointerEvent<HTMLVideoElement>
  ): { x: number; y: number } | null => {
    if (!videoRef.current || !videoWidth || !videoHeight) return null;

    const bounds = videoRef.current.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return null;

    const relX = (event.clientX - bounds.left) / bounds.width;
    const relY = (event.clientY - bounds.top) / bounds.height;

    const clampedX = Math.max(0, Math.min(1, relX));
    const clampedY = Math.max(0, Math.min(1, relY));

    return {
      x: clampedX * videoWidth,
      y: clampedY * videoHeight,
    };
  };

  const handleCropPointerDown = (event: ReactPointerEvent<HTMLVideoElement>) => {
    if (!videoRef.current || !videoWidth || !videoHeight) return;
    if (event.buttons !== 1) return;

    const start = normalizePointerToVideo(event);
    if (!start) return;

    cropStartRef.current = start;
    setCropRect({
      x: start.x,
      y: start.y,
      width: 0,
      height: 0,
    });
    setIsDrawingCrop(true);
  };

  const handleCropPointerMove = (event: ReactPointerEvent<HTMLVideoElement>) => {
    if (!isDrawingCrop || !cropStartRef.current) return;
    if (!videoWidth || !videoHeight) return;

    event.preventDefault();

    const current = normalizePointerToVideo(event);
    if (!current) return;

    const start = cropStartRef.current;
    const x = Math.min(start.x, current.x);
    const y = Math.min(start.y, current.y);
    const width = Math.abs(current.x - start.x);
    const height = Math.abs(current.y - start.y);

    setCropRect({
      x,
      y,
      width,
      height,
    });
  };

  const finishCrop = () => {
    if (!isDrawingCrop) return;

    setIsDrawingCrop(false);

    setCropRect((prev) => {
      if (!prev) return null;
      if (prev.width < 4 || prev.height < 4) {
        // Tiny rectangle: treat as "no crop"
        return null;
      }
      return prev;
    });
  };

  const handleCropPointerUp = () => {
    finishCrop();
  };

  const handleCropPointerLeave = () => {
    finishCrop();
  };

  const handleResetCrop = () => {
    setCropRect(null);
    setIsDrawingCrop(false);
    cropStartRef.current = null;
  };

  /** Helper: choose a supported MediaRecorder mime type */
  const chooseMimeType = (): string => {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    for (const type of candidates) {
      if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "video/webm";
  };

  /** Export trimmed (and optionally cropped) clip using Canvas + MediaRecorder */
  const handleExport = async () => {
    if (!videoRef.current) {
      setStatusMessage("Please load a video and wait for metadata.");
      return;
    }
    if (!videoFile || !videoUrl) {
      setStatusMessage("Please load a video file first.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setEngineState("error");
      setStatusMessage(
        "MediaRecorder is not supported in this browser. Please use a modern browser such as Chrome or Firefox."
      );
      return;
    }
    if (duration <= 0) {
      setStatusMessage(
        "Duration is invalid. Please wait for the video to load."
      );
      return;
    }
    if (trimEnd <= trimStart) {
      setStatusMessage("Invalid trim range. End must be greater than start.");
      return;
    }

    const lengthSeconds = trimEnd - trimStart;
    if (!Number.isFinite(lengthSeconds) || lengthSeconds <= 0) {
      setStatusMessage("Trim length is invalid. Please adjust the range.");
      return;
    }

    const hasValidCrop =
      cropRect &&
      videoWidth &&
      videoHeight &&
      cropRect.width > 4 &&
      cropRect.height > 4;

    if (!videoWidth || !videoHeight) {
      setStatusMessage(
        "Video dimensions are not available yet. Please wait a moment and try again."
      );
      return;
    }

    const video = videoRef.current;

    try {
      setEngineState("exporting");
      setStatusMessage(
        hasValidCrop
          ? "Exporting trimmed and cropped clip in your browser..."
          : "Exporting trimmed clip in your browser..."
      );

      // Create an off-screen canvas for drawing frames
      const canvas = document.createElement("canvas");
      if (hasValidCrop && cropRect) {
        canvas.width = Math.round(cropRect.width);
        canvas.height = Math.round(cropRect.height);
      } else {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setEngineState("error");
        setStatusMessage("Could not get 2D context from canvas.");
        return;
      }

      const fps = 30;
      const canvasStream = (canvas as any).captureStream
        ? canvas.captureStream(fps)
        : null;

      if (!canvasStream) {
        setEngineState("error");
        setStatusMessage(
          "Canvas captureStream is not supported in this browser."
        );
        return;
      }

      // Optionally merge audio from the original video (if available)
      let streamToRecord: MediaStream = canvasStream;
      try {
        if (typeof (video as any).captureStream === "function") {
          const srcStream = (video as any).captureStream() as MediaStream;
          const composed = new MediaStream();
          canvasStream.getVideoTracks().forEach((t) => composed.addTrack(t));
          const audioTracks = srcStream.getAudioTracks();
          if (audioTracks.length > 0) {
            audioTracks.forEach((t) => composed.addTrack(t));
          }
          streamToRecord = composed;
        }
      } catch {
        // If captureStream fails, fall back to video-only canvas stream
        streamToRecord = canvasStream;
      }

      const mimeType = chooseMimeType();
      const recorder = new MediaRecorder(streamToRecord, { mimeType });

      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      const durationMs = lengthSeconds * 1000;

      // Wrap the recording process into a Promise
      await new Promise<void>((resolve, reject) => {
        let stopped = false;

        const handleError = (error: unknown) => {
          if (stopped) return;
          stopped = true;
          recorder.stop();
          video.pause();
          reject(error);
        };

        recorder.onerror = (event) => {
          handleError(event.error || new Error("MediaRecorder error"));
        };

        recorder.onstop = () => {
          if (stopped) return;
          stopped = true;
          video.pause();
          resolve();
        };

        const startRecording = () => {
          try {
            const originalMuted = video.muted;
            video.muted = true;

            recorder.start();

            const startTime = performance.now();
            const endTime = startTime + durationMs;

            const drawFrame = (now: number) => {
              if (now >= endTime || video.currentTime >= trimEnd) {
                try {
                  recorder.stop();
                } catch {
                  // ignore
                }
                video.pause();
                video.muted = originalMuted;
                return;
              }

              const sx = hasValidCrop && cropRect ? cropRect.x : 0;
              const sy = hasValidCrop && cropRect ? cropRect.y : 0;
              const sw = hasValidCrop && cropRect ? cropRect.width : videoWidth;
              const sh =
                hasValidCrop && cropRect ? cropRect.height : videoHeight;

              ctx.drawImage(
                video,
                sx,
                sy,
                sw,
                sh,
                0,
                0,
                canvas.width,
                canvas.height
              );

              requestAnimationFrame(drawFrame);
            };

            const playAndDraw = () => {
              video
                .play()
                .then(() => {
                  const offset = trimStart - video.currentTime;
                  if (Math.abs(offset) > 0.05) {
                    video.currentTime = trimStart;
                    video.pause();
                    video
                      .play()
                      .then(() => requestAnimationFrame(drawFrame))
                      .catch(handleError);
                  } else {
                    requestAnimationFrame(drawFrame);
                  }
                })
                .catch(handleError);
            };

            const onSeeked = () => {
              video.removeEventListener("seeked", onSeeked);
              playAndDraw();
            };

            video.pause();
            video.addEventListener("seeked", onSeeked);
            video.currentTime = trimStart;
          } catch (error) {
            handleError(error);
          }
        };

        startRecording();
      });

      if (chunks.length === 0) {
        setEngineState("error");
        setStatusMessage(
          "Export finished but produced an empty recording. Please try a different trim range or crop."
        );
        return;
      }

      const blob = new Blob(chunks, { type: mimeType });
      const filename = hasValidCrop
        ? "trimmed_cropped_clip.webm"
        : "trimmed_clip.webm";
      const url = URL.createObjectURL(blob);

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
      setDownloadUrl(url);
      setEngineState("done");
      setStatusMessage(
        `Export finished. Download should start automatically. If not, use the link below (${filename}).`
      );

      // Auto-download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
      setEngineState("error");
      setStatusMessage(
        "Failed to export video using Canvas + MediaRecorder. Please check the console and try again."
      );
    }
  };

  /** Use current video time as trim start */
  const useCurrentAsStart = () => {
    if (!videoRef.current || duration <= 0) return;
    let t = videoRef.current.currentTime;
    t = Math.max(0, Math.min(t, duration));
    if (t > trimEnd) {
      t = trimEnd;
    }
    setTrimStart(t);
  };

  /** Use current video time as trim end */
  const useCurrentAsEnd = () => {
    if (!videoRef.current || duration <= 0) return;
    let t = videoRef.current.currentTime;
    t = Math.max(0, Math.min(t, duration));
    if (t < trimStart) {
      t = trimStart;
    }
    setTrimEnd(t);
  };

  const repo = "https://github.com/europanite/client_side_video_editor";

  // --- Track colors ---
  const startPercent = duration > 0 ? (trimStart / duration) * 100 : 0;
  const endPercent = duration > 0 ? (trimEnd / duration) * 100 : 0;

  const rangeTrackStyle: CSSProperties =
    duration > 0
      ? ({
          "--track-gradient": `linear-gradient(to right,
            #4b5563 0%,
            #4b5563 ${startPercent}%,
            #6366f1 ${startPercent}%,
            #6366f1 ${endPercent}%,
            #4b5563 ${endPercent}%,
            #4b5563 100%
          )`,
        } as CSSProperties)
      : ({} as CSSProperties);

  const hasCropSelection =
    cropRect &&
    videoWidth &&
    videoHeight &&
    cropRect.width > 4 &&
    cropRect.height > 4;

  return (
    <div className="app-root">
      <header className="app-header">
        <h1 className="app-title">
          <a
            href={repo}
            target="_blank"
            rel="noreferrer"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            Client Side Video Editor
          </a>
        </h1>
        <p className="app-subtitle">
          A Browser-Based Video Editor for Free. No installation, registration, or payment required. 
        </p>
      </header>

      <main className="app-main">
        <section className="panel panel-input">
          <label className="file-input-label">
            <span className="file-input-text">Choose a video file</span>
            <input
              className="file-input"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
            />
          </label>

          <div className="status-chip">
            <span>{statusMessage}</span>
          </div>
        </section>

        <section className="panel panel-video">
          <h2 className="panel-title">Preview</h2>
          <div className="video-frame">
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  onLoadedMetadata={handleLoadedMetadata}
                  onPointerDown={handleCropPointerDown}
                  onPointerMove={handleCropPointerMove}
                  onPointerUp={handleCropPointerUp}
                  onPointerLeave={handleCropPointerLeave}
                />
                {/* Visual crop rectangle overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                  }}
                  onDoubleClick={handleResetCrop}
                >
                  {hasCropSelection && videoWidth && videoHeight && cropRect && (
                    <div
                      style={{
                        position: "absolute",
                        left: `${(cropRect.x / videoWidth) * 100}%`,
                        top: `${(cropRect.y / videoHeight) * 100}%`,
                        width: `${(cropRect.width / videoWidth) * 100}%`,
                        height: `${(cropRect.height / videoHeight) * 100}%`,
                        border: "2px solid #f97373",
                        backgroundColor: "rgba(249, 115, 129, 0.18)",
                        boxShadow: "0 0 0 1px rgba(15, 23, 42, 0.8)",
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      left: "8px",
                      bottom: "8px",
                      padding: "3px 8px",
                      borderRadius: "999px",
                      fontSize: "0.7rem",
                      backgroundColor: "rgba(15, 23, 42, 0.7)",
                      color: "#e5e7eb",
                    }}
                  >
                    Drag on the video to draw a crop rectangle. Double-click to
                    reset.
                  </div>
                </div>
              </>
            ) : (
              <div className="video-placeholder">
                <span>No video loaded.</span>
              </div>
            )}
          </div>

          {duration > 0 && (
            <div className="duration-info">
              <span>Total duration: {formatTime(duration)}</span>
            </div>
          )}

          <div
            style={{
              marginTop: "8px",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {hasCropSelection && (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleResetCrop}
              >
                Clear crop
              </button>
            )}
            {hasCropSelection && videoWidth && videoHeight && cropRect && (
              <span
                style={{
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                }}
              >
                Crop:{" "}
                {`${Math.round(cropRect.width)}×${Math.round(
                  cropRect.height
                )} px at (${Math.round(cropRect.x)}, ${Math.round(
                  cropRect.y
                )})`}
              </span>
            )}
          </div>
        </section>

        <section className="panel panel-controls">
          <h2 className="panel-title">Trim Range</h2>

          <div className="trim-widget">
            <div className="trim-values-row">
              <span>Start: {formatTime(trimStart)}</span>
              <span>End: {formatTime(trimEnd)}</span>
            </div>

            <div className="trim-slider-wrapper">
              <input
                className="trim-slider trim-slider-start"
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={trimStart}
                onChange={handleTrimStartChange}
                disabled={!videoFile || duration <= 0}
                style={rangeTrackStyle}
              />
              <input
                className="trim-slider trim-slider-end"
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={trimEnd}
                onChange={handleTrimEndChange}
                disabled={!videoFile || duration <= 0}
              />
            </div>

            <div className="trim-input-row">
              <label className="trim-input-group">
                <span className="trim-input-label">Start (sec)</span>
                <input
                  className="time-input"
                  type="number"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={Number.isFinite(trimStart) ? trimStart : 0}
                  onChange={handleTrimStartChange}
                  disabled={!videoFile || duration <= 0}
                />
              </label>
              <label className="trim-input-group">
                <span className="trim-input-label">End (sec)</span>
                <input
                  className="time-input"
                  type="number"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={Number.isFinite(trimEnd) ? trimEnd : 0}
                  onChange={handleTrimEndChange}
                  disabled={!videoFile || duration <= 0}
                />
              </label>
            </div>

            <div className="helper-row">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={useCurrentAsStart}
                disabled={!videoFile || duration <= 0}
              >
                Use current time as Start
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={useCurrentAsEnd}
                disabled={!videoFile || duration <= 0}
              >
                Use current time as End
              </button>
            </div>
          </div>
        </section>

        <section className="panel panel-export">
          <h2 className="panel-title">Export</h2>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleExport}
            disabled={!videoFile || engineState === "exporting"}
          >
            {engineState === "exporting"
              ? "Exporting..."
              : hasCropSelection
              ? "Export Trimmed & Cropped Clip"
              : "Export Trimmed Clip"}
          </button>

          {downloadUrl && (
            <div className="download-row">
              <a
                className="download-link"
                href={downloadUrl}
                download={
                  hasCropSelection
                    ? "trimmed_cropped_clip.webm"
                    : "trimmed_clip.webm"
                }
              >
                Download saved clip
              </a>
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <span>
          All processing happens inside your browser using HTML5 Video, Canvas,
          and MediaRecorder APIs. No server and no WebAssembly are required.
        </span>
      </footer>
    </div>
  );
};

export default App;
