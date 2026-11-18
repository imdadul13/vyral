import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const OAUTH_TOKEN_FILE = path.join(DATA_DIR, "youtube-oauth-tokens.json");

export interface YouTubeOAuthTokenRecord {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope: string;
  channelId?: string;
  channelTitle?: string;
  connectedAt: string;
}

export interface IntegrationTestStatus {
  id: string;
  name: string;
  configured: boolean;
  connected: boolean;
  statusLabel:
    | "Connected"
    | "Not configured"
    | "Authentication failed"
    | "API unavailable"
    | "Quota exceeded"
    | "Test not performed";
  lastTestedAt: string;
  responseTimeMs: number | null;
  details: string;
  errorDetails: string | null;
}

/**
 * Parses ISO 8601 duration (e.g. PT15M33S) into total seconds.
 */
export function parseIsoDurationSeconds(iso: string): number {
  const match = (iso || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

export function readOAuthTokens(): YouTubeOAuthTokenRecord | null {
  try {
    if (!fs.existsSync(OAUTH_TOKEN_FILE)) return null;
    const raw = fs.readFileSync(OAUTH_TOKEN_FILE, "utf-8");
    return JSON.parse(raw) as YouTubeOAuthTokenRecord;
  } catch {
    return null;
  }
}

export function writeOAuthTokens(record: YouTubeOAuthTokenRecord): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(OAUTH_TOKEN_FILE, JSON.stringify(record, null, 2), "utf-8");
}

export function clearOAuthTokens(): void {
  if (fs.existsSync(OAUTH_TOKEN_FILE)) {
    fs.unlinkSync(OAUTH_TOKEN_FILE);
  }
}

/**
 * 3.1 YouTube Data API v3: videos.list, channels.list, search.list, videoCategories.list
 */
export async function fetchYouTubeVideoById(videoId: string): Promise<{
  ok: boolean;
  source: "youtube_data_api_v3" | "youtube_oembed_live";
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelName: string;
  channelSubscribers: number;
  thumbnailUrl: string;
  durationSeconds: number;
  views: number;
  likes: number | null;
  comments: number | null;
  uploadedAt: string;
  categoryId: string;
  error?: string;
}> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (apiKey) {
    try {
      const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${encodeURIComponent(
        videoId
      )}&key=${encodeURIComponent(apiKey)}`;
      const videoRes = await fetch(videoUrl, {
        signal: AbortSignal.timeout(7000),
      });

      if (videoRes.ok) {
        const videoJson = await videoRes.json();
        const item = videoJson.items?.[0];
        if (item) {
          const channelId = item.snippet?.channelId || "";
          let subscribers = 0;

          if (channelId) {
            try {
              const chanRes = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${encodeURIComponent(
                  channelId
                )}&key=${encodeURIComponent(apiKey)}`,
                { signal: AbortSignal.timeout(5000) }
              );
              if (chanRes.ok) {
                const chanJson = await chanRes.json();
                subscribers = Number(
                  chanJson.items?.[0]?.statistics?.subscriberCount || 0
                );
              }
            } catch {
              // Non-fatal channel stats lookup
            }
          }

          return {
            ok: true,
            source: "youtube_data_api_v3",
            videoId,
            title: item.snippet?.title || `Video ${videoId}`,
            description: item.snippet?.description || "",
            channelId,
            channelName: item.snippet?.channelTitle || "YouTube Creator",
            channelSubscribers: subscribers,
            thumbnailUrl:
              item.snippet?.thumbnails?.maxres?.url ||
              item.snippet?.thumbnails?.high?.url ||
              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            durationSeconds:
              parseIsoDurationSeconds(item.contentDetails?.duration || "") ||
              600,
            views: Number(item.statistics?.viewCount || 0),
            likes:
              item.statistics?.likeCount !== undefined
                ? Number(item.statistics.likeCount)
                : null,
            comments:
              item.statistics?.commentCount !== undefined
                ? Number(item.statistics.commentCount)
                : null,
            uploadedAt:
              item.snippet?.publishedAt || new Date().toISOString(),
            categoryId: item.snippet?.categoryId || "28",
          };
        }
      }
    } catch {
      // Fall through to supplementary oEmbed
    }
  }

  // 3.4 Supplementary YouTube oEmbed service
  const oembed = await fetchYouTubeOEmbed(videoId);
  if (oembed.ok) {
    return {
      ok: true,
      source: "youtube_oembed_live",
      videoId,
      title: oembed.title,
      description: "",
      channelId: "",
      channelName: oembed.authorName,
      channelSubscribers: 0,
      thumbnailUrl: oembed.thumbnailUrl,
      durationSeconds: 900,
      views: 0,
      likes: null,
      comments: null,
      uploadedAt: new Date().toISOString(),
      categoryId: "28",
    };
  }

  return {
    ok: false,
    source: "youtube_oembed_live",
    videoId,
    title: `Video (${videoId})`,
    description: "",
    channelId: "",
    channelName: "Unknown Channel",
    channelSubscribers: 0,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    durationSeconds: 600,
    views: 0,
    likes: null,
    comments: null,
    uploadedAt: new Date().toISOString(),
    categoryId: "28",
    error: oembed.error || "Unable to retrieve video metadata",
  };
}

export async function fetchYouTubeOEmbed(videoId: string): Promise<{
  ok: boolean;
  videoId: string;
  title: string;
  authorName: string;
  authorUrl: string;
  thumbnailUrl: string;
  latencyMs: number;
  error?: string;
}> {
  const startedAt = Date.now();
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(
      videoId
    )}&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const latencyMs = Date.now() - startedAt;

    if (!res.ok) {
      return {
        ok: false,
        videoId,
        title: "",
        authorName: "",
        authorUrl: "",
        thumbnailUrl: "",
        latencyMs,
        error: `YouTube oEmbed returned HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      ok: true,
      videoId,
      title: data.title || "",
      authorName: data.author_name || "",
      authorUrl: data.author_url || "",
      thumbnailUrl:
        data.thumbnail_url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      latencyMs,
    };
  } catch (err) {
    return {
      ok: false,
      videoId,
      title: "",
      authorName: "",
      authorUrl: "",
      thumbnailUrl: "",
      latencyMs: Date.now() - startedAt,
      error: err instanceof Error ? err.message : "oEmbed request failed",
    };
  }
}

/**
 * 3.1 Test YouTube Data API v3 Connection (videos.list + videoCategories.list)
 */
export async function testYouTubeDataApiConnection(): Promise<IntegrationTestStatus> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  const now = new Date().toISOString();

  if (!apiKey) {
    return {
      id: "youtube-data-api",
      name: "YouTube Data API v3",
      configured: false,
      connected: false,
      statusLabel: "Not configured",
      lastTestedAt: now,
      responseTimeMs: null,
      details: "Requires YOUTUBE_API_KEY in .env.local",
      errorDetails:
        "Missing YOUTUBE_API_KEY. Create an API key in Google Cloud Console (APIs & Services -> Credentials -> YouTube Data API v3) and set YOUTUBE_API_KEY in .env.local.",
    };
  }

  const startedAt = Date.now();
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=M7lc1UVf-VE&key=${encodeURIComponent(
        apiKey
      )}`,
      { signal: AbortSignal.timeout(7000) }
    );
    const elapsedMs = Date.now() - startedAt;
    const json = await res.json();

    if (!res.ok) {
      const reason =
        json?.error?.errors?.[0]?.reason || json?.error?.message || "";
      const isQuota =
        res.status === 429 ||
        String(reason).toLowerCase().includes("quota");
      const isAuth = res.status === 400 || res.status === 401 || res.status === 403;

      return {
        id: "youtube-data-api",
        name: "YouTube Data API v3",
        configured: true,
        connected: false,
        statusLabel: isQuota
          ? "Quota exceeded"
          : isAuth
          ? "Authentication failed"
          : "API unavailable",
        lastTestedAt: now,
        responseTimeMs: elapsedMs,
        details: `HTTP ${res.status} from youtube/v3/videos`,
        errorDetails: json?.error?.message || `HTTP ${res.status}`,
      };
    }

    const item = json.items?.[0];
    return {
      id: "youtube-data-api",
      name: "YouTube Data API v3",
      configured: true,
      connected: Boolean(item),
      statusLabel: item ? "Connected" : "API unavailable",
      lastTestedAt: now,
      responseTimeMs: elapsedMs,
      details: item
        ? `Verified videos.list ("${item.snippet.title}", ${Number(
            item.statistics.viewCount || 0
          ).toLocaleString()} views)`
        : "No items returned",
      errorDetails: item ? null : "Empty items array returned",
    };
  } catch (err) {
    return {
      id: "youtube-data-api",
      name: "YouTube Data API v3",
      configured: true,
      connected: false,
      statusLabel: "API unavailable",
      lastTestedAt: now,
      responseTimeMs: Date.now() - startedAt,
      details: "Network error reaching googleapis.com",
      errorDetails: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 3.2 YouTube OAuth 2.0 Helpers & Connection Test
 */
export const YOUTUBE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

export function buildYouTubeOAuthUrl(): string | null {
  const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();
  const redirectUri =
    process.env.YOUTUBE_REDIRECT_URI?.trim() ||
    "http://localhost:3005/api/youtube/oauth/callback";
  if (!clientId) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: YOUTUBE_OAUTH_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function testYouTubeOAuthConnection(): Promise<IntegrationTestStatus> {
  const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI?.trim();
  const now = new Date().toISOString();

  if (!clientId || !clientSecret) {
    return {
      id: "youtube-oauth",
      name: "YouTube OAuth 2.0",
      configured: false,
      connected: false,
      statusLabel: "Not configured",
      lastTestedAt: now,
      responseTimeMs: null,
      details: "Requires YOUTUBE_CLIENT_ID & YOUTUBE_CLIENT_SECRET",
      errorDetails:
        "Missing OAuth 2.0 Client ID/Secret. Create an OAuth 2.0 Web Client in Google Cloud Console with redirect URI http://localhost:3005/api/youtube/oauth/callback and place credentials in .env.local.",
    };
  }

  const tokens = readOAuthTokens();
  if (!tokens?.accessToken) {
    return {
      id: "youtube-oauth",
      name: "YouTube OAuth 2.0",
      configured: true,
      connected: false,
      statusLabel: "Test not performed",
      lastTestedAt: now,
      responseTimeMs: 0,
      details: `OAuth Client configured (Redirect: ${redirectUri || "localhost:3005"}). User authorization flow not yet completed.`,
      errorDetails:
        "OAuth client credentials are set, but no creator channel token is stored yet. Click Connect YouTube Account to authorize.",
    };
  }

  const startedAt = Date.now();
  try {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        signal: AbortSignal.timeout(6000),
      }
    );
    const elapsedMs = Date.now() - startedAt;
    if (!res.ok) {
      return {
        id: "youtube-oauth",
        name: "YouTube OAuth 2.0",
        configured: true,
        connected: false,
        statusLabel: "Authentication failed",
        lastTestedAt: now,
        responseTimeMs: elapsedMs,
        details: `OAuth token check returned HTTP ${res.status}`,
        errorDetails: "Stored access token is expired or revoked.",
      };
    }
    const data = await res.json();
    const ch = data.items?.[0];
    return {
      id: "youtube-oauth",
      name: "YouTube OAuth 2.0",
      configured: true,
      connected: true,
      statusLabel: "Connected",
      lastTestedAt: now,
      responseTimeMs: elapsedMs,
      details: `Authorized channel: ${ch?.snippet?.title || tokens.channelTitle || "Connected"}`,
      errorDetails: null,
    };
  } catch (err) {
    return {
      id: "youtube-oauth",
      name: "YouTube OAuth 2.0",
      configured: true,
      connected: false,
      statusLabel: "API unavailable",
      lastTestedAt: now,
      responseTimeMs: Date.now() - startedAt,
      details: "Failed to verify OAuth token",
      errorDetails: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 3.3 YouTube Analytics API Connection Test
 */
export async function testYouTubeAnalyticsConnection(): Promise<IntegrationTestStatus> {
  const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET?.trim();
  const tokens = readOAuthTokens();
  const now = new Date().toISOString();

  if (!clientId || !clientSecret) {
    return {
      id: "youtube-analytics",
      name: "YouTube Analytics API",
      configured: false,
      connected: false,
      statusLabel: "Not configured",
      lastTestedAt: now,
      responseTimeMs: null,
      details: "Requires YouTube OAuth 2.0 with yt-analytics.readonly scope",
      errorDetails:
        "YouTube Analytics API requires OAuth 2.0 user authorization (YOUTUBE_CLIENT_ID & YOUTUBE_CLIENT_SECRET in .env.local).",
    };
  }

  if (!tokens?.accessToken) {
    return {
      id: "youtube-analytics",
      name: "YouTube Analytics API",
      configured: true,
      connected: false,
      statusLabel: "Test not performed",
      lastTestedAt: now,
      responseTimeMs: null,
      details: "Waiting for OAuth 2.0 channel authorization token",
      errorDetails:
        "Complete YouTube OAuth 2.0 sign-in to query private channel watch time, CTR, and retention.",
    };
  }

  const startedAt = Date.now();
  try {
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 28 * 86400 * 1000)
      .toISOString()
      .slice(0, 10);
    const url = `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${startDate}&endDate=${endDate}&metrics=views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
      signal: AbortSignal.timeout(7000),
    });
    const elapsedMs = Date.now() - startedAt;

    if (!res.ok) {
      return {
        id: "youtube-analytics",
        name: "YouTube Analytics API",
        configured: true,
        connected: false,
        statusLabel: "Authentication failed",
        lastTestedAt: now,
        responseTimeMs: elapsedMs,
        details: `HTTP ${res.status} from youtubeanalytics.googleapis.com`,
        errorDetails: `Failed to query channel analytics report (HTTP ${res.status}).`,
      };
    }

    return {
      id: "youtube-analytics",
      name: "YouTube Analytics API",
      configured: true,
      connected: true,
      statusLabel: "Connected",
      lastTestedAt: now,
      responseTimeMs: elapsedMs,
      details: "Verified 28-day channel watch time, retention & subscriber metrics",
      errorDetails: null,
    };
  } catch (err) {
    return {
      id: "youtube-analytics",
      name: "YouTube Analytics API",
      configured: true,
      connected: false,
      statusLabel: "API unavailable",
      lastTestedAt: now,
      responseTimeMs: Date.now() - startedAt,
      details: "Error querying YouTube Analytics API",
      errorDetails: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 3.4 YouTube oEmbed Connection Test
 */
export async function testYouTubeOEmbedConnection(): Promise<IntegrationTestStatus> {
  const now = new Date().toISOString();
  const res = await fetchYouTubeOEmbed("M7lc1UVf-VE");

  return {
    id: "youtube-oembed",
    name: "YouTube oEmbed",
    configured: true,
    connected: res.ok,
    statusLabel: res.ok ? "Connected" : "API unavailable",
    lastTestedAt: now,
    responseTimeMs: res.latencyMs,
    details: res.ok
      ? `Verified public embed metadata ("${res.title}" by ${res.authorName})`
      : "oEmbed lookup failed",
    errorDetails: res.error || null,
  };
}
