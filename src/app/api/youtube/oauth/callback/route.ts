import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/?oauth_error=${encodeURIComponent(error)}`, req.url)
    );
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET?.trim();
  const redirectUri =
    process.env.YOUTUBE_REDIRECT_URI?.trim() ||
    "http://localhost:3005/api/youtube/oauth/callback";

  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL(
        "/?oauth_error=missing_oauth_credentials_or_authorization_code",
        req.url
      )
    );
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL(`/?oauth_error=token_exchange_failed_${tokenRes.status}`, req.url)
      );
    }

    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token as string | undefined;

    let channelTitle = "Connected YouTube Channel";
    if (accessToken) {
      const chRes = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (chRes.ok) {
        const chData = await chRes.json();
        const chTitle = chData.items?.[0]?.snippet?.title;
        if (chTitle) channelTitle = chTitle;
      }
    }

    const db = readDb();
    db.settings.youtubeOAuthConnected = true;
    db.settings.youtubeChannelTitle = channelTitle;
    writeDb(db);

    return NextResponse.redirect(new URL("/?oauth_connected=1", req.url));
  } catch (err) {
    return NextResponse.redirect(
      new URL(
        `/?oauth_error=${encodeURIComponent(
          err instanceof Error ? err.message : "oauth_callback_exception"
        )}`,
        req.url
      )
    );
  }
}
