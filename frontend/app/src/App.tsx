import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FC,
} from "react";

// Use the new FFmpeg class API (v12+)
import { FFmpeg } from "@ffmpeg/ffmpeg";

// Create a single FFmpeg instance for the app
const ffmpeg = new FFmpeg();

type ExportState =
  | "idle"
  | "loading-engine"
  | "ready"
  | "exporting"
  | "done"
  | "error";

const App: FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [engineState, setEngineState] = useState<ExportState>("loading-engine");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [duration, setDuration] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);

  const [statusMessage, setStatusMessage] = useState<string>(
    "Loading video engine..."
  );
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Load FFmpeg.wasm once on mount
  useEffect(() => {
    let cancelled = false;

    const loadFfmpeg = async () => {
      try {
        setEngineState("loading-engine");
        setStatusMessage(
          "Loading video engine (FFmpeg.wasm). This can take a while on the first load..."
        );

        await ffmpeg.load();

        if (!cancelled) {
          setFfmpegReady(true);
          setEngineState("ready");
          setStatusMessage("Engine ready. Please load a video file.");
        }
      } catch (error) {
        console.error("Failed to load FFmpeg:", error);
        if (!cancelled) {
          setEngineState("error");
          setStatusMessage(
            "Failed to load FFmpeg. Please check the console and your network."
          );
        }
      }
    };

    loadFfmpeg();

    return () => {
      cancelled = true;
    };
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
    setStatusMessage("Video loaded. Waiting for metadata...");
  };

  /** When the video metadata is loaded, we know the duration */
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const d = videoRef.current.duration;
    if (!Number.isFinite(d) || d <= 0) {
      setStatusMessage("Could not read video duration.");
      return;
    }
    setDuration(d);
    setTrimStart(0);
    setTrimEnd(d);
    setStatusMessage("Ready to edit. Adjust the trim range and export.");
  };

  /** Slider / input change helpers */
  const handleTrimStartChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) return;

    setTrimStart(Math.max(0, Math.min(value, duration)));
  };

  const handleTrimEndChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) return;

    setTrimEnd(Math.max(0, Math.min(value, duration)));
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

  /** Export trimmed clip using FFmpeg.wasm */
  const handleExport = async () => {
    if (!videoFile) {
      setStatusMessage("Please load a video file first.");
      return;
    }
    if (!ffmpegReady) {
      setStatusMessage("Video engine is not ready yet.");
      return;
    }
    if (duration <= 0) {
      setStatusMessage("Duration is invalid. Please wait for the video to load.");
      return;
    }
    if (trimEnd <= trimStart) {
      setStatusMessage("Invalid trim range. End must be greater than start.");
      return;
    }

    try {
      setEngineState("exporting");
      setStatusMessage("Exporting trimmed clip... This can take some time.");

      // Clean previous outputs if any (new API uses deleteFile)
      try {
        await ffmpeg.deleteFile("input.mp4");
      } catch {
        // ignore
      }
      try {
        await ffmpeg.deleteFile("output.mp4");
      } catch {
        // ignore
      }

      // Write input file into FFmpeg virtual FS
      const inputBuffer = await videoFile.arrayBuffer();
      const inputData = new Uint8Array(inputBuffer);
      await ffmpeg.writeFile("input.mp4", inputData);

      // Prepare arguments
      const startArg = trimStart.toFixed(2);
      const lengthSeconds = trimEnd - trimStart;
      const lengthArg = lengthSeconds.toFixed(2);

      // -ss: start, -t: duration, -c copy: avoid re-encoding when possible
      await ffmpeg.exec([
        "-ss",
        startArg,
        "-i",
        "input.mp4",
        "-t",
        lengthArg,
        "-c",
        "copy",
        "output.mp4",
      ]);

      // Read the result
      const fileData = await ffmpeg.readFile("output.mp4"); // Uint8Array (FileData)

      // Normalize to a plain Uint8Array so Blob typing works with strict TS
      const outputData: Uint8Array =
        fileData instanceof Uint8Array
          ? new Uint8Array(fileData)
          : new TextEncoder().encode(String(fileData));

      const outputData =
        fileData instanceof Uint8Array
          ? fileData
          : new TextEncoder().encode(String(fileData));

      const blob = new Blob([outputData], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
      setDownloadUrl(url);
      setEngineState("done");
      setStatusMessage("Export finished. You can download the trimmed clip.");

      // Clean up FS
      await ffmpeg.deleteFile("input.mp4");
      await ffmpeg.deleteFile("output.mp4");
    } catch (error) {
      console.error("Export failed:", error);
      setEngineState("error");
      setStatusMessage(
        "Failed to export video. Please check the console for details."
      );
    }
  };

  /** Use current video time as trim start */
  const useCurrentAsStart = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setTrimStart(Math.max(0, Math.min(t, duration)));
  };

  /** Use current video time as trim end */
  const useCurrentAsEnd = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setTrimEnd(Math.max(0, Math.min(t, duration)));
  };

  const repo = "https://github.com/europanite/client_side_video_editor";

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
          Load a video file, choose a start and end time, and export a trimmed
          MP4 clip.
        </p>
      </header>

      <main className="app-main">
        <section className="panel panel-input">
          <h2 className="panel-title">1. Load Video</h2>
          <label className="file-input-label">
            <span className="file-input-text">
              Choose a video file (it never leaves your browser)
            </span>
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
          <h2 className="panel-title">2. Preview</h2>
          <div className="video-frame">
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                onLoadedMetadata={handleLoadedMetadata}
              />
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
        </section>

        <section className="panel panel-controls">
          <h2 className="panel-title">3. Trim Range</h2>

          <div className="slider-row">
            <label className="slider-label">
              Start ({formatTime(trimStart)})
            </label>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={trimStart}
              onChange={handleTrimStartChange}
              disabled={!videoFile}
            />
            <input
              className="time-input"
              type="number"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Number.isFinite(trimStart) ? trimStart : 0}
              onChange={handleTrimStartChange}
              disabled={!videoFile}
            />
          </div>

          <div className="slider-row">
            <label className="slider-label">
              End ({formatTime(trimEnd)})
            </label>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={trimEnd}
              onChange={handleTrimEndChange}
              disabled={!videoFile}
            />
            <input
              className="time-input"
              type="number"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Number.isFinite(trimEnd) ? trimEnd : 0}
              onChange={handleTrimEndChange}
              disabled={!videoFile}
            />
          </div>

          <div className="helper-row">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={useCurrentAsStart}
              disabled={!videoFile}
            >
              Use current time as Start
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={useCurrentAsEnd}
              disabled={!videoFile}
            >
              Use current time as End
            </button>
          </div>
        </section>

        <section className="panel panel-export">
          <h2 className="panel-title">4. Export</h2>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleExport}
            disabled={!videoFile || !ffmpegReady || engineState === "exporting"}
          >
            {engineState === "exporting"
              ? "Exporting..."
              : "Export Trimmed Clip"}
          </button>

          {downloadUrl && (
            <div className="download-row">
              <a
                className="download-link"
                href={downloadUrl}
                download="trimmed_clip.mp4"
              >
                Download trimmed_clip.mp4
              </a>
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <span>
          All processing happens inside your browser using FFmpeg.wasm. Large
          files may take time.
        </span>
      </footer>
    </div>
  );
};

export default App;
