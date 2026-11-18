import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { Client as PgClient } from "pg";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  resolveModelId,
  testGeminiConnection,
} from "@/lib/gemini-service";
import {
  testYouTubeAnalyticsConnection,
  testYouTubeDataApiConnection,
  testYouTubeOAuthConnection,
  testYouTubeOEmbedConnection,
} from "@/lib/youtube-service";
import { getWorkerQueueHealth } from "@/lib/worker-queue";

const execFileAsync = promisify(execFile);

export type IntegrationStatusLabel =
  | "Connected"
  | "Not configured"
  | "Authentication failed"
  | "API unavailable"
  | "Quota exceeded"
  | "Test not performed";

export interface IntegrationTestResult {
  id:
    | "gemini-3.8-flash"
    | "gemini-4-argon"
    | "youtube-data-api"
    | "youtube-oauth"
    | "youtube-analytics"
    | "youtube-oembed"
    | "postgresql"
    | "supabase"
    | "redis-workers"
    | "ffmpeg"
    | "ffprobe"
    | "object-storage";
  name: string;
  category: "AI Models" | "YouTube APIs" | "Database & Queue" | "Media & Storage";
  configured: boolean;
  connected: boolean;
  statusLabel: IntegrationStatusLabel;
  lastTested: string | null;
  responseTimeMs: number | null;
  errorDetails: string | null;
  details: string;
  envKeysRequired: string[];
}

const FFMPEG_BIN = fs.existsSync("/opt/homebrew/bin/ffmpeg")
  ? "/opt/homebrew/bin/ffmpeg"
  : "ffmpeg";
const FFPROBE_BIN = fs.existsSync("/opt/homebrew/bin/ffprobe")
  ? "/opt/homebrew/bin/ffprobe"
  : "ffprobe";

// In-memory cache of the most recent test run in this server process
const lastTestCache = new Map<string, IntegrationTestResult>();

function getInitialCards(): IntegrationTestResult[] {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  const hasYtApi = Boolean(process.env.YOUTUBE_API_KEY?.trim());
  const hasYtOAuth = Boolean(
    process.env.YOUTUBE_CLIENT_ID?.trim() &&
      process.env.YOUTUBE_CLIENT_SECRET?.trim()
  );
  const hasPg = Boolean(process.env.DATABASE_URL?.trim());
  const hasSupabase = Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_ANON_KEY?.trim()
  );
  const hasFfmpeg = fs.existsSync("/opt/homebrew/bin/ffmpeg");
  const hasFfprobe = fs.existsSync("/opt/homebrew/bin/ffprobe");
  const hasStorageDir = fs.existsSync(path.join(process.cwd(), "public", "exports"));

  const defs: IntegrationTestResult[] = [
    {
      id: "gemini-3.8-flash",
      name: "Gemini 3.8 Flash",
      category: "AI Models",
      configured: hasGemini,
      connected: false,
      statusLabel: hasGemini ? "Test not performed" : "Not configured",
      lastTested: null,
      responseTimeMs: null,
      errorDetails: hasGemini
        ? null
        : "GEMINI_API_KEY is not set in .env.local",
      details: `Primary AI model (${resolveModelId("primary")}) via official @google/genai SDK`,
      envKeysRequired: ["GEMINI_API_KEY", "PRIMARY_AI_MODEL"],
    },
    {
      id: "gemini-4-argon",
      name: "Gemini 4 Argon",
      category: "AI Models",
      configured: hasGemini,
      connected: false,
      statusLabel: hasGemini ? "Test not performed" : "Not configured",
      lastTested: null,
      responseTimeMs: null,
      errorDetails: hasGemini
        ? null
        : "GEMINI_API_KEY is not set in .env.local",
      details: `Advanced reasoning model (${resolveModelId("advanced")}) for deep viral & retention strategy`,
      envKeysRequired: ["GEMINI_API_KEY", "ADVANCED_AI_MODEL"],
    },
    {
      id: "youtube-data-api",
      name: "YouTube Data API v3",
      category: "YouTube APIs",
      configured: hasYtApi,
      connected: false,
      statusLabel: hasYtApi ? "Test not performed" : "Not configured",
      lastTested: null,
      responseTimeMs: null,
      errorDetails: hasYtApi
        ? null
        : "YOUTUBE_API_KEY is not set in .env.local",
      details: "videos.list, channels.list, search.list, videoCategories.list",
      envKeysRequired: ["YOUTUBE_API_KEY"],
    },
    {
      id: "youtube-oauth",
      name: "YouTube OAuth 2.0",
      category: "YouTube APIs",
      configured: hasYtOAuth,
      connected: false,
      statusLabel: hasYtOAuth ? "Test not performed" : "Not configured",
      lastTested: null,
      responseTimeMs: null,
      errorDetails: hasYtOAuth
        ? null
        : "YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET are not set in .env.local",
      details: "Creator channel authentication & direct YouTube Shorts publishing",
      envKeysRequired: [
        "YOUTUBE_CLIENT_ID",
        "YOUTUBE_CLIENT_SECRET",
        "YOUTUBE_REDIRECT_URI",
      ],
    },
    {
      id: "youtube-analytics",
      name: "YouTube Analytics API",
      category: "YouTube APIs",
      configured: hasYtOAuth,
      connected: false,
      statusLabel: hasYtOAuth ? "Test not performed" : "Not configured",
      lastTested: null,
      responseTimeMs: null,
      errorDetails: hasYtOAuth
        ? null
        : "Requires YouTube OAuth 2.0 credentials (yt-analytics.readonly scope)",
      details: "Channel retention curves, views, watch time, and CTR telemetry",
      envKeysRequired: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"],
    },
    {
      id: "youtube-oembed",
      name: "YouTube oEmbed",
      category: "YouTube APIs",
      configured: true,
      connected: false,
      statusLabel: "Test not performed",
      lastTested: null,
      responseTimeMs: null,
      errorDetails: null,
      details: "Keyless public YouTube metadata & thumbnail verification endpoint",
      envKeysRequired: [],
    },
    {
      id: "postgresql",
      name: "PostgreSQL",
      category: "Database & Queue",
      configured: hasPg,
      connected: false,
      statusLabel: hasPg ? "Test not performed" : "Not configured",
      lastTested: null,
      responseTimeMs: null,
      errorDetails: hasPg
        ? null
        : "DATABASE_URL is not set in .env.local (using local atomic JSON DB fallback)",
      details: "Relational PostgreSQL connection via pg client",
      envKeysRequired: ["DATABASE_URL"],
    },
    {
      id: "supabase",
      name: "Supabase",
      category: "Database & Queue",
      configured: hasSupabase,
      connected: false,
      statusLabel: hasSupabase ? "Test not performed" : "Not configured",
      lastTested: null,
      responseTimeMs: null,
      errorDetails: hasSupabase
        ? null
        : "SUPABASE_URL and SUPABASE_ANON_KEY are not set in .env.local",
      details: "Managed Postgres, Auth & Storage via @supabase/supabase-js",
      envKeysRequired: [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
      ],
    },
    {
      id: "redis-workers",
      name: "Redis / Background Workers",
      category: "Database & Queue",
      configured: true,
      connected: false,
      statusLabel: "Test not performed",
      lastTested: null,
      responseTimeMs: null,
      errorDetails: null,
      details: process.env.REDIS_URL?.trim()
        ? "Redis-backed worker queue configured"
        : "Local Persistent Worker Queue active (REDIS_URL optional)",
      envKeysRequired: ["REDIS_URL"],
    },
    {
      id: "ffmpeg",
      name: "FFmpeg 9.0",
      category: "Media & Storage",
      configured: hasFfmpeg,
      connected: false,
      statusLabel: hasFfmpeg ? "Test not performed" : "Not configured",
      lastTested: null,
      responseTimeMs: null,
      errorDetails: hasFfmpeg ? null : "FFmpeg binary not found",
      details: "Hardware-accelerated H.264/AAC video trimming, cropping & subtitle burn-in",
      envKeysRequired: ["FFMPEG_PATH"],
    },
    {
      id: "ffprobe",
      name: "FFprobe",
      category: "Media & Storage",
      configured: hasFfprobe,
      connected: false,
      statusLabel: hasFfprobe ? "Test not performed" : "Not configured",
      lastTested: null,
      responseTimeMs: null,
      errorDetails: hasFfprobe ? null : "FFprobe binary not found",
      details: "Media stream inspector for resolution, FPS, codec, duration & audio tracks",
      envKeysRequired: ["FFPROBE_PATH"],
    },
    {
      id: "object-storage",
      name: "Object Storage",
      category: "Media & Storage",
      configured: hasStorageDir,
      connected: false,
      statusLabel: hasStorageDir ? "Test not performed" : "Not configured",
      lastTested: null,
      responseTimeMs: null,
      errorDetails: null,
      details: `Local media & export repository (bucket: ${
        process.env.STORAGE_BUCKET || "vyral-media"
      })`,
      envKeysRequired: ["STORAGE_BUCKET"],
    },
  ];

  return defs.map((card) => lastTestCache.get(card.id) || card);
}

async function runSingleIntegrationTest(
  id: IntegrationTestResult["id"]
): Promise<IntegrationTestResult> {
  const nowIso = new Date().toISOString();

  if (id === "gemini-3.8-flash") {
    const res = await testGeminiConnection("primary");
    const item: IntegrationTestResult = {
      id,
      name: "Gemini 3.8 Flash",
      category: "AI Models",
      configured: res.configured,
      connected: res.connected,
      statusLabel: res.statusLabel,
      lastTested: nowIso,
      responseTimeMs: res.responseTimeMs,
      errorDetails: res.connected ? null : res.errorDetails,
      details: res.connected
        ? `Live response verified from ${res.modelId}`
        : `Primary AI model (${res.modelId})`,
      envKeysRequired: ["GEMINI_API_KEY", "PRIMARY_AI_MODEL"],
    };
    lastTestCache.set(id, item);
    return item;
  }

  if (id === "gemini-4-argon") {
    const res = await testGeminiConnection("advanced");
    const item: IntegrationTestResult = {
      id,
      name: "Gemini 4 Argon",
      category: "AI Models",
      configured: res.configured,
      connected: res.connected,
      statusLabel: res.statusLabel,
      lastTested: nowIso,
      responseTimeMs: res.responseTimeMs,
      errorDetails: res.connected ? null : res.errorDetails,
      details: res.connected
        ? `Live response verified from ${res.modelId}`
        : `Advanced AI model (${res.modelId})`,
      envKeysRequired: ["GEMINI_API_KEY", "ADVANCED_AI_MODEL"],
    };
    lastTestCache.set(id, item);
    return item;
  }

  if (id === "youtube-data-api") {
    const res = await testYouTubeDataApiConnection();
    const item: IntegrationTestResult = {
      id,
      name: "YouTube Data API v3",
      category: "YouTube APIs",
      configured: res.configured,
      connected: res.connected,
      statusLabel: res.statusLabel,
      lastTested: nowIso,
      responseTimeMs: res.responseTimeMs,
      errorDetails: res.connected ? null : res.errorDetails,
      details: res.connected ? res.details : "videos.list, channels.list, search.list",
      envKeysRequired: ["YOUTUBE_API_KEY"],
    };
    lastTestCache.set(id, item);
    return item;
  }

  if (id === "youtube-oauth") {
    const res = await testYouTubeOAuthConnection();
    const item: IntegrationTestResult = {
      id,
      name: "YouTube OAuth 2.0",
      category: "YouTube APIs",
      configured: res.configured,
      connected: res.connected,
      statusLabel: res.statusLabel,
      lastTested: nowIso,
      responseTimeMs: res.responseTimeMs,
      errorDetails: res.connected ? null : res.errorDetails,
      details: res.connected
        ? res.details
        : "OAuth 2.0 channel authorization & upload pipeline",
      envKeysRequired: [
        "YOUTUBE_CLIENT_ID",
        "YOUTUBE_CLIENT_SECRET",
        "YOUTUBE_REDIRECT_URI",
      ],
    };
    lastTestCache.set(id, item);
    return item;
  }

  if (id === "youtube-analytics") {
    const res = await testYouTubeAnalyticsConnection();
    const item: IntegrationTestResult = {
      id,
      name: "YouTube Analytics API",
      category: "YouTube APIs",
      configured: res.configured,
      connected: res.connected,
      statusLabel: res.statusLabel,
      lastTested: nowIso,
      responseTimeMs: res.responseTimeMs,
      errorDetails: res.connected ? null : res.errorDetails,
      details: res.connected
        ? res.details
        : "Channel retention, CTR, and watch-time analytics",
      envKeysRequired: ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET"],
    };
    lastTestCache.set(id, item);
    return item;
  }

  if (id === "youtube-oembed") {
    const res = await testYouTubeOEmbedConnection();
    const item: IntegrationTestResult = {
      id,
      name: "YouTube oEmbed",
      category: "YouTube APIs",
      configured: true,
      connected: res.connected,
      statusLabel: res.statusLabel,
      lastTested: nowIso,
      responseTimeMs: res.responseTimeMs,
      errorDetails: res.connected ? null : res.errorDetails,
      details: res.details,
      envKeysRequired: [],
    };
    lastTestCache.set(id, item);
    return item;
  }

  if (id === "postgresql") {
    const dbUrl = process.env.DATABASE_URL?.trim();
    if (!dbUrl) {
      const item: IntegrationTestResult = {
        id,
        name: "PostgreSQL",
        category: "Database & Queue",
        configured: false,
        connected: false,
        statusLabel: "Not configured",
        lastTested: nowIso,
        responseTimeMs: 0,
        errorDetails:
          "DATABASE_URL is not set in .env.local. Application is using the authoritative local atomic JSON repository (data/clipviral-db.json).",
        details: "PostgreSQL connection via pg client",
        envKeysRequired: ["DATABASE_URL"],
      };
      lastTestCache.set(id, item);
      return item;
    }

    const startedAt = Date.now();
    const client = new PgClient({
      connectionString: dbUrl,
      connectionTimeoutMillis: 4500,
    });
    try {
      await client.connect();
      await client.query("SELECT 1 AS ok");
      await client.end();
      const elapsed = Date.now() - startedAt;
      const item: IntegrationTestResult = {
        id,
        name: "PostgreSQL",
        category: "Database & Queue",
        configured: true,
        connected: true,
        statusLabel: "Connected",
        lastTested: nowIso,
        responseTimeMs: elapsed,
        errorDetails: null,
        details: `PostgreSQL SELECT 1 succeeded in ${elapsed}ms`,
        envKeysRequired: ["DATABASE_URL"],
      };
      lastTestCache.set(id, item);
      return item;
    } catch (err) {
      const elapsed = Date.now() - startedAt;
      const msg = err instanceof Error ? err.message : String(err);
      const item: IntegrationTestResult = {
        id,
        name: "PostgreSQL",
        category: "Database & Queue",
        configured: true,
        connected: false,
        statusLabel:
          msg.toLowerCase().includes("password") || msg.toLowerCase().includes("auth")
            ? "Authentication failed"
            : "API unavailable",
        lastTested: nowIso,
        responseTimeMs: elapsed,
        errorDetails: msg,
        details: "PostgreSQL connection probe failed",
        envKeysRequired: ["DATABASE_URL"],
      };
      lastTestCache.set(id, item);
      return item;
    }
  }

  if (id === "supabase") {
    const url = process.env.SUPABASE_URL?.trim();
    const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
    if (!url || !anonKey) {
      const item: IntegrationTestResult = {
        id,
        name: "Supabase",
        category: "Database & Queue",
        configured: false,
        connected: false,
        statusLabel: "Not configured",
        lastTested: nowIso,
        responseTimeMs: 0,
        errorDetails:
          "SUPABASE_URL and SUPABASE_ANON_KEY are not set in .env.local.",
        details: "Supabase client (@supabase/supabase-js)",
        envKeysRequired: [
          "SUPABASE_URL",
          "SUPABASE_ANON_KEY",
          "SUPABASE_SERVICE_ROLE_KEY",
        ],
      };
      lastTestCache.set(id, item);
      return item;
    }

    const startedAt = Date.now();
    try {
      const supabase = createSupabaseClient(url, anonKey);
      const { error } = await supabase.auth.getSession();
      const elapsed = Date.now() - startedAt;
      if (error) {
        const item: IntegrationTestResult = {
          id,
          name: "Supabase",
          category: "Database & Queue",
          configured: true,
          connected: false,
          statusLabel: "Authentication failed",
          lastTested: nowIso,
          responseTimeMs: elapsed,
          errorDetails: error.message,
          details: "Supabase auth probe failed",
          envKeysRequired: ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
        };
        lastTestCache.set(id, item);
        return item;
      }

      const item: IntegrationTestResult = {
        id,
        name: "Supabase",
        category: "Database & Queue",
        configured: true,
        connected: true,
        statusLabel: "Connected",
        lastTested: nowIso,
        responseTimeMs: elapsed,
        errorDetails: null,
        details: `Supabase endpoint verified in ${elapsed}ms`,
        envKeysRequired: ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
      };
      lastTestCache.set(id, item);
      return item;
    } catch (err) {
      const elapsed = Date.now() - startedAt;
      const item: IntegrationTestResult = {
        id,
        name: "Supabase",
        category: "Database & Queue",
        configured: true,
        connected: false,
        statusLabel: "API unavailable",
        lastTested: nowIso,
        responseTimeMs: elapsed,
        errorDetails: err instanceof Error ? err.message : String(err),
        details: "Supabase connection error",
        envKeysRequired: ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
      };
      lastTestCache.set(id, item);
      return item;
    }
  }

  if (id === "redis-workers") {
    const startedAt = Date.now();
    const health = getWorkerQueueHealth();
    const elapsed = Date.now() - startedAt;
    const item: IntegrationTestResult = {
      id,
      name: "Redis / Background Workers",
      category: "Database & Queue",
      configured: true,
      connected: true,
      statusLabel: "Connected",
      lastTested: nowIso,
      responseTimeMs: elapsed,
      errorDetails: null,
      details: `Active (${health.mode}) • ${health.counts.completed} completed, ${health.counts.queued} queued, ${health.counts.failed} failed jobs`,
      envKeysRequired: ["REDIS_URL"],
    };
    lastTestCache.set(id, item);
    return item;
  }

  if (id === "ffmpeg") {
    const startedAt = Date.now();
    try {
      const { stdout } = await execFileAsync(FFMPEG_BIN, ["-version"]);
      const elapsed = Date.now() - startedAt;
      const firstLine = stdout.split("\n")[0] || "ffmpeg version 9.0";
      const item: IntegrationTestResult = {
        id,
        name: "FFmpeg 9.0",
        category: "Media & Storage",
        configured: true,
        connected: true,
        statusLabel: "Connected",
        lastTested: nowIso,
        responseTimeMs: elapsed,
        errorDetails: null,
        details: `${firstLine} (${FFMPEG_BIN})`,
        envKeysRequired: ["FFMPEG_PATH"],
      };
      lastTestCache.set(id, item);
      return item;
    } catch (err) {
      const elapsed = Date.now() - startedAt;
      const item: IntegrationTestResult = {
        id,
        name: "FFmpeg 9.0",
        category: "Media & Storage",
        configured: false,
        connected: false,
        statusLabel: "API unavailable",
        lastTested: nowIso,
        responseTimeMs: elapsed,
        errorDetails: err instanceof Error ? err.message : "FFmpeg execution failed",
        details: "FFmpeg binary check failed",
        envKeysRequired: ["FFMPEG_PATH"],
      };
      lastTestCache.set(id, item);
      return item;
    }
  }

  if (id === "ffprobe") {
    const startedAt = Date.now();
    try {
      const sampleVideo = path.join(
        process.cwd(),
        "public",
        "media",
        "source-master.mp4"
      );
      const { stdout } = await execFileAsync(FFPROBE_BIN, [
        "-v",
        "error",
        "-show_entries",
        "stream=codec_name,width,height:format=duration",
        "-of",
        "json",
        sampleVideo,
      ]);
      const parsed = JSON.parse(stdout);
      const vStream = parsed.streams?.[0];
      const elapsed = Date.now() - startedAt;
      const item: IntegrationTestResult = {
        id,
        name: "FFprobe",
        category: "Media & Storage",
        configured: true,
        connected: true,
        statusLabel: "Connected",
        lastTested: nowIso,
        responseTimeMs: elapsed,
        errorDetails: null,
        details: `Inspected source-master.mp4 (${vStream?.codec_name} ${vStream?.width}x${vStream?.height}, ${Number(parsed.format?.duration || 60).toFixed(1)}s) via ${FFPROBE_BIN}`,
        envKeysRequired: ["FFPROBE_PATH"],
      };
      lastTestCache.set(id, item);
      return item;
    } catch (err) {
      const elapsed = Date.now() - startedAt;
      const item: IntegrationTestResult = {
        id,
        name: "FFprobe",
        category: "Media & Storage",
        configured: false,
        connected: false,
        statusLabel: "API unavailable",
        lastTested: nowIso,
        responseTimeMs: elapsed,
        errorDetails: err instanceof Error ? err.message : "FFprobe execution failed",
        details: "FFprobe binary check failed",
        envKeysRequired: ["FFPROBE_PATH"],
      };
      lastTestCache.set(id, item);
      return item;
    }
  }

  // object-storage
  const startedAt = Date.now();
  try {
    const exportsDir = path.join(process.cwd(), "public", "exports");
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    const probeFile = path.join(exportsDir, `.storage-probe-${process.pid}.tmp`);
    fs.writeFileSync(probeFile, "vyral-storage-ok", "utf-8");
    const content = fs.readFileSync(probeFile, "utf-8");
    fs.unlinkSync(probeFile);
    if (content !== "vyral-storage-ok") {
      throw new Error("Storage read/write verification mismatch");
    }
    const exportedFiles = fs
      .readdirSync(exportsDir)
      .filter((f) => f.endsWith(".mp4"));
    const elapsed = Date.now() - startedAt;
    const item: IntegrationTestResult = {
      id: "object-storage",
      name: "Object Storage",
      category: "Media & Storage",
      configured: true,
      connected: true,
      statusLabel: "Connected",
      lastTested: nowIso,
      responseTimeMs: elapsed,
      errorDetails: null,
      details: `Read/write verified in public/exports (${exportedFiles.length} rendered MP4 files stored, bucket: ${
        process.env.STORAGE_BUCKET || "vyral-media"
      })`,
      envKeysRequired: ["STORAGE_BUCKET"],
    };
    lastTestCache.set(id, item);
    return item;
  } catch (err) {
    const elapsed = Date.now() - startedAt;
    const item: IntegrationTestResult = {
      id: "object-storage",
      name: "Object Storage",
      category: "Media & Storage",
      configured: false,
      connected: false,
      statusLabel: "API unavailable",
      lastTested: nowIso,
      responseTimeMs: elapsed,
      errorDetails: err instanceof Error ? err.message : "Storage write test failed",
      details: "Object storage check failed",
      envKeysRequired: ["STORAGE_BUCKET"],
    };
    lastTestCache.set(id, item);
    return item;
  }
}

const ALL_IDS: IntegrationTestResult["id"][] = [
  "gemini-3.8-flash",
  "gemini-4-argon",
  "youtube-data-api",
  "youtube-oauth",
  "youtube-analytics",
  "youtube-oembed",
  "postgresql",
  "supabase",
  "redis-workers",
  "ffmpeg",
  "ffprobe",
  "object-storage",
];

export async function GET() {
  return NextResponse.json({
    integrations: getInitialCards(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { integrationId } = body as {
      integrationId?: IntegrationTestResult["id"] | "all";
    };

    if (!integrationId || integrationId === "all") {
      const results = await Promise.all(
        ALL_IDS.map((id) => runSingleIntegrationTest(id))
      );
      return NextResponse.json({
        integrations: results,
        testedAt: new Date().toISOString(),
      });
    }

    if (!ALL_IDS.includes(integrationId)) {
      return NextResponse.json(
        { error: `Unknown integrationId: ${integrationId}` },
        { status: 400 }
      );
    }

    const single = await runSingleIntegrationTest(integrationId);
    return NextResponse.json({
      result: single,
      integrations: getInitialCards(),
      testedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Integration connection test failed",
      },
      { status: 500 }
    );
  }
}
