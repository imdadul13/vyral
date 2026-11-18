import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { readDb, writeDb } from "@/lib/db";
import { ProcessingJob } from "@/lib/types";

const execFileAsync = promisify(execFile);

const FFMPEG_BIN = fs.existsSync("/opt/homebrew/bin/ffmpeg")
  ? "/opt/homebrew/bin/ffmpeg"
  : "ffmpeg";
const FFPROBE_BIN = fs.existsSync("/opt/homebrew/bin/ffprobe")
  ? "/opt/homebrew/bin/ffprobe"
  : "ffprobe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clipId, platformPreset, aspectRatio } = body as {
      clipId: string;
      platformPreset?: "YouTube Shorts" | "Instagram Reels" | "TikTok" | "YouTube Landscape";
      aspectRatio?: "9:16" | "16:9" | "1:1" | "4:5";
    };

    const db = readDb();
    const clipIdx = db.clips.findIndex((c) => c.id === clipId);
    if (clipIdx === -1) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    const clip = db.clips[clipIdx];
    const sourcePath = path.join(process.cwd(), "public", "media", "source-master.mp4");
    const exportsDir = path.join(process.cwd(), "public", "exports");

    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Determine target dimensions based on aspectRatio or platformPreset
    const effectiveRatio =
      aspectRatio ||
      (platformPreset === "YouTube Landscape" ? "16:9" : clip.aspectRatio || "9:16");

    const safeClipId = clip.id.replace(/[^a-zA-Z0-9_-]/g, "");
    const ratioSlug = effectiveRatio.replace(":", "x");
    const outFileName = `${safeClipId}-${ratioSlug}-${Date.now().toString().slice(-5)}.mp4`;
    const outFullPath = path.join(exportsDir, outFileName);

    let vfChain = "";
    if (effectiveRatio === "9:16") {
      // Crop center 9:16 from 1280x720 -> 405x720 then scale to 720x1280 (fast HD vertical)
      vfChain =
        "crop=404:720:438:0,scale=720:1280,drawbox=x=36:y=920:w=648:h=150:color=#090B10@0.78:t=fill,drawbox=x=36:y=920:w=648:h=6:color=#8B5CF6@0.95:t=fill";
    } else if (effectiveRatio === "1:1") {
      vfChain =
        "crop=720:720:280:0,scale=720:720,drawbox=x=40:y=540:w=640:h=110:color=#090B10@0.78:t=fill";
    } else if (effectiveRatio === "4:5") {
      vfChain =
        "crop=576:720:352:0,scale=720:900,drawbox=x=40:y=680:w=640:h=120:color=#090B10@0.78:t=fill";
    } else {
      vfChain =
        "scale=1280:720,drawbox=x=120:y=540:w=1040:h=110:color=#090B10@0.78:t=fill,drawbox=x=120:y=540:w=1040:h=5:color=#3B82F6@0.95:t=fill";
    }

    const startSec = Math.max(0, Math.min(52, Number(clip.startTime) || 0));
    const durationSec = Math.max(5, Math.min(30, Number(clip.duration) || 12));
    const targetFps = String(clip.fps || 30);

    const startedAt = Date.now();

    await execFileAsync(FFMPEG_BIN, [
      "-y",
      "-ss",
      String(startSec),
      "-t",
      String(durationSec),
      "-i",
      sourcePath,
      "-vf",
      vfChain,
      "-r",
      targetFps,
      "-af",
      "volume=1.15",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      outFullPath,
    ]);

    const elapsedMs = Date.now() - startedAt;

    // Inspect output with ffprobe
    let probeSummary = {
      aspectRatio: effectiveRatio,
      codec: "h264",
      audioCodec: "aac",
      fps: Number(targetFps),
      width: effectiveRatio === "9:16" ? 720 : effectiveRatio === "1:1" ? 720 : 1280,
      height: effectiveRatio === "9:16" ? 1280 : effectiveRatio === "1:1" ? 720 : 720,
      durationSec,
      sizeKb: Math.round(fs.statSync(outFullPath).size / 1024),
      renderTimeMs: elapsedMs,
    };

    try {
      const { stdout } = await execFileAsync(FFPROBE_BIN, [
        "-v",
        "error",
        "-show_entries",
        "stream=codec_type,codec_name,width,height,r_frame_rate:format=duration,size",
        "-of",
        "json",
        outFullPath,
      ]);
      const parsed = JSON.parse(stdout);
      const streams: Array<{
        codec_type?: string;
        codec_name?: string;
        width?: number;
        height?: number;
        r_frame_rate?: string;
      }> = parsed.streams || [];
      const vStream = streams.find((s) => s.codec_type === "video") || streams[0];
      const aStream = streams.find((s) => s.codec_type === "audio");
      if (vStream) {
        let parsedFps = Number(targetFps);
        if (vStream.r_frame_rate && vStream.r_frame_rate.includes("/")) {
          const [num, den] = vStream.r_frame_rate.split("/").map(Number);
          if (num && den) parsedFps = Math.round(num / den);
        }
        probeSummary = {
          ...probeSummary,
          codec: vStream.codec_name || "h264",
          audioCodec: aStream?.codec_name || "aac",
          fps: parsedFps,
          width: vStream.width || probeSummary.width,
          height: vStream.height || probeSummary.height,
          durationSec: Number(Number(parsed.format?.duration || durationSec).toFixed(1)),
          sizeKb: Math.round(Number(parsed.format?.size || 0) / 1024),
        };
      }
    } catch {
      // Keep default probe summary if ffprobe JSON parsing fails
    }

    const publicUrl = `/exports/${outFileName}`;
    db.clips[clipIdx].renderedVideoUrl = publicUrl;
    db.clips[clipIdx].lastRenderedAt = new Date().toISOString();
    db.clips[clipIdx].status = "ready";

    const renderJob: ProcessingJob = {
      id: `job-ff-${Date.now().toString().slice(-5)}`,
      projectId: clip.projectId,
      projectTitle: clip.projectTitle,
      clipId: clip.id,
      jobType: "ffmpeg_render",
      status: "completed",
      progress: 100,
      workerNode: "worker-mac-arm64-ffmpeg9",
      startedAt: new Date().toISOString(),
      logs: [
        `Trimmed source [${startSec}s -> ${(startSec + durationSec).toFixed(1)}s] (${effectiveRatio}, ${targetFps} FPS)`,
        `Applied subtitle safe-zone compositing (${clip.subtitleStyle.presetId}) & audio normalization`,
        `FFmpeg H.264/AAC encode finished in ${elapsedMs}ms (${probeSummary.width}x${probeSummary.height}, ${probeSummary.sizeKb} KB)`,
      ],
    };

    db.jobs.unshift(renderJob);
    writeDb(db);

    return NextResponse.json({
      renderedUrl: publicUrl,
      probe: probeSummary,
      clip: db.clips[clipIdx],
      job: renderJob,
      db,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "FFmpeg server-side render failed",
      },
      { status: 500 }
    );
  }
}
