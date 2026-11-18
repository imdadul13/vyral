import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function POST() {
  try {
    const db = readDb();
    const nowIso = new Date().toISOString();
    const apiKey = process.env.YOUTUBE_API_KEY;

    // If YOUTUBE_API_KEY is configured, query real viewCount from YouTube Data API v3
    const liveStatsMap: Record<string, { views: number; likes?: number; comments?: number }> = {};

    if (apiKey) {
      try {
        const ids = db.trendingVideos.map((v) => v.youtubeVideoId).join(",");
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${apiKey}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (res.ok) {
          const data = await res.json();
          for (const item of data.items || []) {
            liveStatsMap[item.id] = {
              views: Number(item.statistics?.viewCount || 0),
              likes: item.statistics?.likeCount ? Number(item.statistics.likeCount) : undefined,
              comments: item.statistics?.commentCount
                ? Number(item.statistics.commentCount)
                : undefined,
            };
          }
        }
      } catch {
        // Fallback to incremental snapshot observation
      }
    }

    db.trendingVideos = db.trendingVideos.map((video) => {
      const live = liveStatsMap[video.youtubeVideoId];
      const nextViews = live
        ? Math.max(video.currentViews, live.views)
        : video.currentViews + Math.round(video.estimatedViewsPerHour * 0.96);

      const updatedSnapshots = [
        ...video.snapshots.slice(-24),
        { observedAt: nowIso, viewCount: nextViews },
      ];

      const latest = updatedSnapshots[updatedSnapshots.length - 1].viewCount;
      const prev1h = updatedSnapshots[Math.max(0, updatedSnapshots.length - 2)].viewCount;
      const prev2h = updatedSnapshots[Math.max(0, updatedSnapshots.length - 3)].viewCount;
      const prev6h = updatedSnapshots[Math.max(0, updatedSnapshots.length - 7)].viewCount;
      const oldest = updatedSnapshots[0].viewCount;
      const elapsedHours = Math.max(1, updatedSnapshots.length - 1);

      const growthLast1h = Math.max(0, latest - prev1h);
      const prevDelta = Math.max(1, prev1h - prev2h);
      const growthLast6h = Math.max(0, latest - prev6h);
      const growthLast24h = Math.max(0, latest - oldest);
      const estimatedViewsPerHour = Math.round(growthLast24h / elapsedHours);
      const estimatedViewsPerDay = estimatedViewsPerHour * 24;
      const accelerationPercent = Number(
        (((growthLast1h - prevDelta) / prevDelta) * 100).toFixed(1)
      );

      return {
        ...video,
        currentViews: latest,
        likes: live?.likes ?? video.likes,
        comments: live?.comments ?? video.comments,
        snapshotCount: updatedSnapshots.length,
        snapshots: updatedSnapshots,
        estimatedViewsPerHour,
        estimatedViewsPerDay,
        growthLast1h,
        growthLast6h,
        growthLast24h,
        accelerationPercent,
        isLiveApiData: Boolean(live),
      };
    });

    writeDb(db);
    return NextResponse.json({
      observedAt: nowIso,
      trendingVideos: db.trendingVideos,
      db,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record snapshot" },
      { status: 500 }
    );
  }
}
