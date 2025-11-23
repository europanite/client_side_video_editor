import React, {
  useEffect,
  useRef,
  useState,
  ChangeEvent,
  FC,
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

type OutputFormat = "same-as-input" | "mp4" | "webm";

const DEFAULT_OUTPUT_FORMAT: OutputFormat = "same-as-input";

/**
 * Extract a simple, lowercase file extension from a filename.
 * For example: "video.MP4" -> "mp4"
 */
function getFileExtension(filename: string | null | undefined): string | null {
  if (!filename) return null;
  const parts = filename.split(".");
  if (parts.length < 2) return null;
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Map a file extension to a reasonable MIME type for the download Blob.
 */
function getMimeTypeForExtension(ext: string): string {
  switch (ext) {
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    default:
      // Fallback for unknown extensions
      return "application/octet-stream";
  }
}

/**
 * Decide which extension to use for the output file based on:
 * - the selected output format
 * - the original input extension
 */
function resolveOutputExtension(
  format: OutputFormat,
  inputExt: string | null
): string {
  if (format === "same-as-input" && inputExt) {
    return inputExt;
  }
  switch (format) {
    case "mp4":
      return "mp4";
    case "webm":
      return "webm";
    default:
      // Fallback if somehow unknown: use mp4
      return "mp4";
  }
}

const App: FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [engineState, setEngineState] = useState<ExportState>("loading-engine");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [inputExtension, setInputExtension] = useState<string | null>(null);

  const [duration, setDuration] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(0);

  const [statusMessage, setStatusMessage] = useState<string>(
    "Loading video engine..."
  );
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>(
    DEFAULT_OUTPUT_FORMAT
  );

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
    const ext = getFileExtension(file.name);

    setVideoFile(file);
    setVideoUrl(url);
    setInputExtension(ext);

    setTrimStart(0);
    setTrimEnd(0);
    setDuration(0);

    // Reset output format to the default (same as input)
    setOutputFormat(DEFAULT_OUTPUT_FORMAT);

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

  /** Handle output format selection */
  const handleOutputFormatChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as OutputFormat;
    setOutputFormat(value);
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

    // Decide input / output extensions
    const inputExt = inputExtension || "mp4";
    const outputExt = resolveOutputExtension(outputFormat, inputExtension);

    const inputName = `input.${inputExt}`;
    const outputName = `output.${outputExt}`;

    try {
      setEngineState("exporting");
      setStatusMessage(
        `Exporting trimmed clip as .${outputExt}... This can take some time.`
      );

      // Clean previous outputs if any (new API uses deleteFile)
      try {
        await ffmpeg.deleteFile(inputName);
      } catch {
        // ignore if it does not exist
      }
      try {
        await ffmpeg.deleteFile(outputName);
      } catch {
        // ignore if it does not exist
      }

      // Write input file into FFmpeg virtual FS
      const inputBuffer = await videoFile.arrayBuffer();
      const inputData = new Uint8Array(inputBuffer);
      await ffmpeg.writeFile(inputName, inputData);

      // Prepare arguments
      const startArg = trimStart.toFixed(2);
      const lengthSeconds = trimEnd - trimStart;
      const lengthArg = lengthSeconds.toFixed(2);

      // Base args: trim segment
      const args: string[] = [
        "-ss",
        startArg,
        "-i",
        inputName,
        "-t",
        lengthArg,
      ];

      // If the container does not change, we can try stream copy to avoid re-encode
      if (outputExt === inputExt) {
        args.push("-c", "copy");
      }

      // Finally, output file
      args.push(outputName);

      await ffmpeg.exec(args);

      // Read the result
      const fileData = await ffmpeg.readFile(outputName); // Uint8Array (FileData)
      const outputData =
        fileData instanceof Uint8Array
          ? fileData
          : new TextEncoder().encode(String(fileData));

      const mimeType = getMimeTypeForExtension(outputExt);
      const blob = new Blob([outputData], { type: mimeType });

      const url = URL.createObjectURL(blob);

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
      setDownloadUrl(url);
      setEngineState("done");
      setStatusMessage(
        `Export finished. You can download the trimmed clip as .${outputExt}.`
      );

      // Clean up FS
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
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

  // Human-friendly label for the current output format
  const describeOutputFormat = (): string => {
    if (!videoFile) return "—";
    const inputExt = inputExtension || "mp4";
    switch (outputFormat) {
      case "same-as-input":
        return `Same as input (.${inputExt})`;
      case "mp4":
        return "MP4 (.mp4)";
      case "webm":
        return "WebM (.webm)";
      default:
        return "Unknown";
    }
  };

  const effectiveOutputExtension = resolveOutputExtension(
    outputFormat,
    inputExtension
  );
  const downloadFileName = `trimmed_clip.${effectiveOutputExtension}`;

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
          clip (MP4, WebM etc.). All processing stays in your browser.
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

          <div className="slider-row">
            <label className="slider-label">Output format</label>
            <select
              className="time-input"
              value={outputFormat}
              onChange={handleOutputFormatChange}
              disabled={!videoFile}
            >
              <option value="same-as-input">
                {videoFile
                  ? `Same as input (${inputExtension || "mp4"})`
                  : "Same as input"}
              </option>
              <option value="mp4">MP4 (.mp4)</option>
              <option value="webm">WebM (.webm)</option>
            </select>
            <small style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
              Current selection: {describeOutputFormat()}
            </small>
          </div>

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
                download={downloadFileName}
              >
                Download {downloadFileName}
              </a>
            </div>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <span>
          All processing happens inside your browser using FFmpeg.wasm. Large
          files and re-encoding between formats may take time.
        </span>
      </footer>
    </div>
  );
};

export default App;
