import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import {
  buildYouTubeOAuthUrl,
  clearOAuthTokens,
} from "@/lib/youtube-service";

export async function GET() {
  const db = readDb();
  const authUrl = buildYouTubeOAuthUrl();
  const oauthClientConfigured = Boolean(
    process.env.YOUTUBE_CLIENT_ID?.trim() &&
      process.env.YOUTUBE_CLIENT_SECRET?.trim()
  );
  const redirectUri =
    process.env.YOUTUBE_REDIRECT_URI?.trim() ||
    "http://localhost:3005/api/youtube/oauth/callback";

  return NextResponse.json({
    connected: db.settings.youtubeOAuthConnected,
    channelTitle: db.settings.youtubeChannelTitle,
    oauthClientConfigured,
    redirectUri,
    authUrl,
    scopes: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
  });
}

export async function DELETE() {
  const db = readDb();
  clearOAuthTokens();
  db.settings.youtubeOAuthConnected = false;
  db.settings.youtubeChannelTitle = null;
  writeDb(db);

  return NextResponse.json({
    connected: false,
    channelTitle: null,
    db,
  });
}
