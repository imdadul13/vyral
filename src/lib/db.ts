import fs from "fs";
import path from "path";
import {
  ABExperiment,
  BrandKitConfig,
  CalendarScheduleItem,
  ClipGenerationConfig,
  DatabaseSchema,
  PlatformSettings,
  ProcessingJob,
  TranscriptSegment,
  TrendingVideoItem,
  VideoProject,
  ViralRadarData,
} from "./types";
import { generateClipCandidatesFromTranscript } from "./viral-engine";
import { generateCompletePublishingPackage } from "./publishing-optimizer";

export type { DatabaseSchema };

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "clipviral-db.json");

const SAMPLE_TRANSCRIPT_1: TranscriptSegment[] = [
  {
    id: "seg-1",
    start: 0.0,
    end: 5.2,
    text: "The biggest mistake creators make is optimizing for views instead of retention velocity.",
    speaker: "Host",
    energyScore: 95,
  },
  {
    id: "seg-2",
    start: 5.2,
    end: 11.4,
    text: "When you capture attention in the first two seconds, the algorithm pushes your clip globally.",
    speaker: "Host",
    energyScore: 92,
  },
  {
    id: "seg-3",
    start: 11.4,
    end: 17.8,
    text: "Look at the data from ten thousand viral shorts: um ninety percent of drop-offs happen before second three.",
    speaker: "Speaker 1",
    energyScore: 89,
  },
  {
    id: "seg-4",
    start: 17.8,
    end: 24.5,
    text: "Stop starting videos with hey guys welcome back! Start in the middle of the highest conflict idea.",
    speaker: "Host",
    energyScore: 96,
  },
  {
    id: "seg-5",
    start: 24.5,
    end: 31.0,
    text: "Here is why controversial storytelling beats high production value every single time in 2026.",
    speaker: "Speaker 2",
    energyScore: 94,
  },
  {
    id: "seg-6",
    start: 31.0,
    end: 38.4,
    text: "If a viewer can predict your ending in the first five seconds, they swipe away instantly.",
    speaker: "Speaker 2",
    energyScore: 91,
  },
  {
    id: "seg-7",
    start: 38.4,
    end: 45.2,
    text: "Build an open curiosity loop, deliver unexpected proof, and end on a punchy takeaway that sparks comments.",
    speaker: "Host",
    energyScore: 93,
  },
  {
    id: "seg-8",
    start: 45.2,
    end: 53.0,
    text: "Nobody talks about audio pacing: removing just four hundred milliseconds of dead air boosts completion by eighteen percent.",
    speaker: "Speaker 1",
    energyScore: 90,
  },
  {
    id: "seg-9",
    start: 53.0,
    end: 60.0,
    text: "That single shift turned a three-hour podcast into forty million organic impressions in thirty days.",
    speaker: "Host",
    energyScore: 97,
  },
];

const SAMPLE_TRANSCRIPT_2: TranscriptSegment[] = [
  {
    id: "seg-201",
    start: 0.0,
    end: 6.5,
    text: "99% of people building AI startups right now are solving a problem that models will automate next quarter.",
    speaker: "Host",
    energyScore: 96,
  },
  {
    id: "seg-202",
    start: 6.5,
    end: 14.0,
    text: "The real moat is workflow orchestration, proprietary distribution, and sub-second creator latency.",
    speaker: "Speaker 1",
    energyScore: 91,
  },
  {
    id: "seg-203",
    start: 14.0,
    end: 22.0,
    text: "When we analyzed the fastest growing SaaS companies, their secret was turning complex studio tools into one click.",
    speaker: "Host",
    energyScore: 93,
  },
  {
    id: "seg-204",
    start: 22.0,
    end: 30.0,
    text: "Never bet against creators who publish ten high-signal vertical clips every single day with zero friction.",
    speaker: "Speaker 1",
    energyScore: 94,
  },
];

function computeSnapshotMetrics(item: {
  id: string;
  youtubeVideoId: string;
  title: string;
  channelName: string;
  channelSubscribers: number;
  thumbnailUrl: string;
  country: TrendingVideoItem["country"];
  category: TrendingVideoItem["category"];
  language: string;
  topic: string;
  uploadedHoursAgo: number;
  durationSeconds: number;
  likes: number;
  comments: number;
  hourlyViewsHistory: number[]; // ordered oldest -> newest (1h intervals, 25 points = 24h)
  outperformingChannelFactor: number;
  isLiveApiData?: boolean;
}): TrendingVideoItem {
  const now = Date.now();
  const snapshots = item.hourlyViewsHistory.map((viewCount, idx) => {
    const hoursBack = item.hourlyViewsHistory.length - 1 - idx;
    return {
      observedAt: new Date(now - hoursBack * 3600 * 1000).toISOString(),
      viewCount,
    };
  });

  const latest = snapshots[snapshots.length - 1].viewCount;
  const prev1h = snapshots[Math.max(0, snapshots.length - 2)].viewCount;
  const prev2h = snapshots[Math.max(0, snapshots.length - 3)].viewCount;
  const prev6h = snapshots[Math.max(0, snapshots.length - 7)].viewCount;
  const prev24h = snapshots[0].viewCount;
  const elapsedHours = Math.max(1, snapshots.length - 1);

  const growthLast1h = Math.max(0, latest - prev1h);
  const prevHourDelta = Math.max(1, prev1h - prev2h);
  const growthLast6h = Math.max(0, latest - prev6h);
  const growthLast24h = Math.max(0, latest - prev24h);

  // Views per hour = Estimated views gained during observation period / elapsed hours
  const estimatedViewsPerHour = Math.round(growthLast24h / elapsedHours);
  const estimatedViewsPerDay = estimatedViewsPerHour * 24;
  const accelerationPercent = Number(
    (((growthLast1h - prevHourDelta) / prevHourDelta) * 100).toFixed(1)
  );
  const viewsToSubscriberRatio = Number(
    (latest / Math.max(1, item.channelSubscribers)).toFixed(2)
  );
  const engagementRate = Number(
    (((item.likes + item.comments) / Math.max(1, latest)) * 100).toFixed(2)
  );

  // Trending opportunity score (0-100) using velocity, acceleration, engagement, channel ratio, recency
  const velocityFactor = Math.min(35, (estimatedViewsPerHour / 1500) * 10);
  const accelFactor = Math.min(20, Math.max(0, accelerationPercent * 0.45));
  const ratioFactor = Math.min(20, viewsToSubscriberRatio * 4.5);
  const engageFactor = Math.min(15, engagementRate * 1.8);
  const recencyFactor = item.uploadedHoursAgo <= 18 ? 10 : 6;
  const trendingOpportunityScore = Math.min(
    99,
    Math.max(68, Math.round(velocityFactor + accelFactor + ratioFactor + engageFactor + recencyFactor))
  );

  return {
    id: item.id,
    youtubeVideoId: item.youtubeVideoId,
    youtubeUrl: `https://www.youtube.com/watch?v=${item.youtubeVideoId}`,
    title: item.title,
    channelName: item.channelName,
    channelSubscribers: item.channelSubscribers,
    thumbnailUrl: item.thumbnailUrl,
    country: item.country,
    category: item.category,
    language: item.language,
    topic: item.topic,
    uploadedAt: new Date(now - item.uploadedHoursAgo * 3600 * 1000).toISOString(),
    durationSeconds: item.durationSeconds,
    currentViews: latest,
    likes: item.likes,
    comments: item.comments,
    observationIntervalHours: 1,
    snapshotCount: snapshots.length,
    snapshots,
    estimatedViewsPerHour,
    estimatedViewsPerDay,
    viewsToSubscriberRatio,
    engagementRate,
    growthLast1h,
    growthLast6h,
    growthLast24h,
    accelerationPercent,
    trendingOpportunityScore,
    outperformingChannelFactor: item.outperformingChannelFactor,
    isLiveApiData: Boolean(item.isLiveApiData),
  };
}

function buildInitialSeed(): DatabaseSchema {
  const defaultConfig1: ClipGenerationConfig = {
    clipCount: 5,
    targetDuration: 15,
    aspectRatio: "9:16",
    resolution: "1080p",
    fps: 60,
    language: "en",
    subtitlePresetId: "hormozi-bold",
    speakerTracking: true,
    autoReframing: true,
    backgroundEnhancement: true,
    ownershipConfirmed: true,
  };

  const clips1 = generateClipCandidatesFromTranscript({
    projectId: "proj-101",
    projectTitle: "The Science of 100M Views: Retention Velocity & AI Storytelling",
    youtubeVideoId: "M7lc1UVf-VE",
    thumbnailUrl: "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg",
    sourceVideoUrl: "/media/source-master.mp4",
    transcript: SAMPLE_TRANSCRIPT_1,
    config: defaultConfig1,
  });

  // Mark first clip as already rendered with our real MP4
  if (clips1[0]) {
    clips1[0].renderedVideoUrl = "/media/source-master.mp4";
    clips1[0].lastRenderedAt = new Date().toISOString();
  }
  if (clips1[1]) {
    clips1[1].subtitleStyle.presetId = "mrbeast-dynamic";
    clips1[1].publishedPlatform = "YouTube Shorts";
    clips1[1].status = "published";
    clips1[1].publishedUrl = "https://youtube.com/shorts/M7lc1UVf-VE";
  }

  const defaultConfig2: ClipGenerationConfig = {
    clipCount: 3,
    targetDuration: 15,
    aspectRatio: "9:16",
    resolution: "1080p",
    fps: 30,
    language: "en",
    subtitlePresetId: "karaoke-highlight",
    speakerTracking: true,
    autoReframing: true,
    backgroundEnhancement: false,
    ownershipConfirmed: true,
  };

  const clips2 = generateClipCandidatesFromTranscript({
    projectId: "proj-102",
    projectTitle: "Why 99% of AI SaaS Startups Fail Distribution (Founder Deep Dive)",
    youtubeVideoId: "aqz-KE-bpKQ",
    thumbnailUrl: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    sourceVideoUrl: "/media/source-master.mp4",
    transcript: SAMPLE_TRANSCRIPT_2,
    config: defaultConfig2,
  });

  const allClips = [...clips1, ...clips2];

  const projects: VideoProject[] = [
    {
      id: "proj-101",
      youtubeVideoId: "M7lc1UVf-VE",
      youtubeUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
      title: "The Science of 100M Views: Retention Velocity & AI Storytelling",
      channelName: "Creator Intelligence Lab",
      channelSubscribers: 1420000,
      durationSeconds: 2640,
      thumbnailUrl: "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg",
      language: "en",
      captionSource: "youtube_captions",
      metadataSource: "authorized_demo_media",
      status: "completed",
      avgViralScore: Math.round(
        clips1.reduce((acc, c) => acc + c.viralScore, 0) / Math.max(1, clips1.length)
      ),
      clipIds: clips1.map((c) => c.id),
      transcript: SAMPLE_TRANSCRIPT_1,
      config: defaultConfig1,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: "proj-102",
      youtubeVideoId: "aqz-KE-bpKQ",
      youtubeUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      title: "Why 99% of AI SaaS Startups Fail Distribution (Founder Deep Dive)",
      channelName: "Silicon Valley Dispatch",
      channelSubscribers: 685000,
      durationSeconds: 3180,
      thumbnailUrl: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
      language: "en",
      captionSource: "youtube_captions",
      metadataSource: "authorized_demo_media",
      status: "completed",
      avgViralScore: Math.round(
        clips2.reduce((acc, c) => acc + c.viralScore, 0) / Math.max(1, clips2.length)
      ),
      clipIds: clips2.map((c) => c.id),
      transcript: SAMPLE_TRANSCRIPT_2,
      config: defaultConfig2,
      createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    },
  ];

  const trendingVideos: TrendingVideoItem[] = [
    computeSnapshotMetrics({
      id: "trend-1",
      youtubeVideoId: "M7lc1UVf-VE",
      title: "How One Autonomous Agent Replaced Our $40k/mo Content Agency Pipeline",
      channelName: "Kieran Builds AI",
      channelSubscribers: 94000,
      thumbnailUrl: "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg",
      country: "United States",
      category: "Technology",
      language: "en",
      topic: "Autonomous AI Workflows",
      uploadedHoursAgo: 11,
      durationSeconds: 1420,
      likes: 41200,
      comments: 3890,
      hourlyViewsHistory: [
        112000, 124000, 138000, 154000, 171000, 190000, 212000, 236000, 263000, 294000, 329000, 368000, 416000,
      ],
      outperformingChannelFactor: 6.4,
    }),
    computeSnapshotMetrics({
      id: "trend-2",
      youtubeVideoId: "aqz-KE-bpKQ",
      title: "Inside India's Fastest Growing Creator Studio: 0 to 10M Subscribers Blueprint",
      channelName: "Mumbai Founder Podcast",
      channelSubscribers: 310000,
      thumbnailUrl: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
      country: "India",
      category: "Podcasts",
      language: "hi",
      topic: "Creator Economy India",
      uploadedHoursAgo: 16,
      durationSeconds: 4320,
      likes: 76500,
      comments: 6120,
      hourlyViewsHistory: [
        420000, 452000, 486000, 523000, 562000, 605000, 651000, 702000, 758000, 819000, 886000, 960000, 1044000,
      ],
      outperformingChannelFactor: 4.9,
    }),
    computeSnapshotMetrics({
      id: "trend-3",
      youtubeVideoId: "ysz5S6PUM-U",
      title: "The Unspoken Economics of High-Retention Short Form Video in 2026",
      channelName: "FinTech & Media Breakdown",
      channelSubscribers: 185000,
      thumbnailUrl: "https://i.ytimg.com/vi/ysz5S6PUM-U/hqdefault.jpg",
      country: "United Kingdom",
      category: "Business",
      language: "en",
      topic: "Media Monetization",
      uploadedHoursAgo: 9,
      durationSeconds: 1980,
      likes: 28900,
      comments: 2140,
      hourlyViewsHistory: [
        88000, 96000, 105000, 115000, 127000, 141000, 157000, 175000, 196000, 221000, 249000, 281000, 319000,
      ],
      outperformingChannelFactor: 5.2,
    }),
    computeSnapshotMetrics({
      id: "trend-4",
      youtubeVideoId: "jNQXAC9IVRw",
      title: "We Tested 50 Esports Pro Gaming Setups at 540Hz — Only 1 Actually Mattered",
      channelName: "Apex Frame Lab",
      channelSubscribers: 520000,
      thumbnailUrl: "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
      country: "Global",
      category: "Gaming",
      language: "en",
      topic: "Competitive Gaming Hardware",
      uploadedHoursAgo: 19,
      durationSeconds: 1650,
      likes: 64200,
      comments: 5310,
      hourlyViewsHistory: [
        510000, 535000, 561000, 589000, 619000, 651000, 686000, 723000, 764000, 809000, 858000, 912000, 974000,
      ],
      outperformingChannelFactor: 3.8,
    }),
    computeSnapshotMetrics({
      id: "trend-5",
      youtubeVideoId: "dQw4w9WgXcQ",
      title: "Why Neuroscientists Say 90-Minute Deep Work Blocks Rewire Dopamine Receptors",
      channelName: "Cognitive Performance Lab",
      channelSubscribers: 240000,
      thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      country: "United States",
      category: "Education",
      language: "en",
      topic: "Neuroscience & Focus",
      uploadedHoursAgo: 7,
      durationSeconds: 2310,
      likes: 39400,
      comments: 3120,
      hourlyViewsHistory: [
        95000, 108000, 122000, 138000, 156000, 177000, 201000, 228000, 259000, 295000, 336000, 383000, 439000,
      ],
      outperformingChannelFactor: 5.9,
    }),
    computeSnapshotMetrics({
      id: "trend-6",
      youtubeVideoId: "9bZkp7q19f0",
      title: "Global Semiconductor Supply Shock: What Happens Next Week to GPU Cloud Pricing",
      channelName: "Macro Tech Briefing",
      channelSubscribers: 410000,
      thumbnailUrl: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
      country: "Global",
      category: "News",
      language: "en",
      topic: "AI Infrastructure & Chips",
      uploadedHoursAgo: 5,
      durationSeconds: 1140,
      likes: 22100,
      comments: 4050,
      hourlyViewsHistory: [
        64000, 76000, 89000, 104000, 121000, 141000, 164000, 190000, 220000, 254000, 293000, 338000, 391000,
      ],
      outperformingChannelFactor: 4.5,
    }),
    computeSnapshotMetrics({
      id: "trend-7",
      youtubeVideoId: "M7lc1UVf-VE",
      title: "The 4:30 AM Discipline Protocol: Why Elite Performers Eliminate Morning Decisions",
      channelName: "Peak Mindset Collective",
      channelSubscribers: 165000,
      thumbnailUrl: "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg",
      country: "United States",
      category: "Motivation",
      language: "en",
      topic: "High-Performance Habits",
      uploadedHoursAgo: 8,
      durationSeconds: 1320,
      likes: 34800,
      comments: 2890,
      hourlyViewsHistory: [
        72000, 84000, 98000, 114000, 132000, 153000, 177000, 204000, 235000, 270000, 310000, 355000, 408000,
      ],
      outperformingChannelFactor: 5.4,
    }),
    computeSnapshotMetrics({
      id: "trend-8",
      youtubeVideoId: "aqz-KE-bpKQ",
      title: "Tactical Breakdown: How Biomechanics & AI Telemetry Changed Sprint World Records",
      channelName: "Velocity Sports Lab",
      channelSubscribers: 290000,
      thumbnailUrl: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
      country: "United Kingdom",
      category: "Sports",
      language: "en",
      topic: "Sports Analytics & Biomechanics",
      uploadedHoursAgo: 12,
      durationSeconds: 1540,
      likes: 41900,
      comments: 3410,
      hourlyViewsHistory: [
        110000, 125000, 142000, 161000, 182000, 206000, 233000, 263000, 297000, 335000, 378000, 426000, 481000,
      ],
      outperformingChannelFactor: 4.7,
    }),
  ];

  const jobs: ProcessingJob[] = [
    {
      id: "job-901",
      projectId: "proj-101",
      projectTitle: "The Science of 100M Views: Retention Velocity & AI Storytelling",
      clipId: clips1[0]?.id,
      jobType: "ffmpeg_render",
      status: "completed",
      progress: 100,
      workerNode: "worker-mac-arm64-videotoolbox",
      startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      logs: [
        "Verified source media stream via ffprobe (1280x720, H.264, 30fps, AAC)",
        "Applied smart 9:16 vertical crop + active speaker safe-zone lock",
        "Burned Hormozi Bold captions & normalized integrated loudness (-14 LUFS)",
        "Encoded MP4 (H.264 + AAC) in 1.4s via Apple Silicon NEON",
      ],
    },
    {
      id: "job-902",
      projectId: "proj-102",
      projectTitle: "Why 99% of AI SaaS Startups Fail Distribution (Founder Deep Dive)",
      jobType: "gemini_viral_analysis",
      status: "completed",
      progress: 100,
      workerNode: "gemini-3.8-flash-analyzer",
      startedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      logs: [
        "Retrieved authorized caption track (English, word-aligned)",
        "Scored 14 candidate windows across 10 virality dimensions",
        "Ranked top 3 self-contained moments (avg score: 91/100)",
      ],
    },
  ];

  const viralRadar: ViralRadarData = {
    emergingTopics: [
      {
        id: "rad-1",
        topic: "Local-First Autonomous Video Agents",
        niche: "Technology",
        country: "United States",
        velocityScore: 96,
        searchGrowthPercent: 420,
        saturationLevel: "Low — Early Wave",
        recommendedHookAngle: "Why cloud editors are being replaced by local zero-latency AI pipelines...",
        sampleKeywords: ["local ai video", "autonomous clipping", "zero latency workflow"],
        history7d: [18, 24, 31, 45, 62, 81, 96],
      },
      {
        id: "rad-2",
        topic: "Dopamine-Detox Micro-Documentaries",
        niche: "Education",
        country: "Global",
        velocityScore: 93,
        searchGrowthPercent: 315,
        saturationLevel: "Low — Early Wave",
        recommendedHookAngle: "What happens to your prefrontal cortex after 72 hours without algorithmic feeds...",
        sampleKeywords: ["attention span", "deep focus", "neuroscience shorts"],
        history7d: [22, 28, 35, 49, 64, 79, 93],
      },
      {
        id: "rad-3",
        topic: "Tier-2 City Bootstrapped SaaS Founders",
        niche: "Business",
        country: "India",
        velocityScore: 91,
        searchGrowthPercent: 280,
        saturationLevel: "Medium — Accelerating",
        recommendedHookAngle: "How a 3-person team in Jaipur built a $4M ARR global product with $0 VC...",
        sampleKeywords: ["indie saas india", "bootstrapped arr", "micro saas podcast"],
        history7d: [30, 36, 44, 53, 67, 80, 91],
      },
      {
        id: "rad-4",
        topic: "Binaural Audio Storytelling in Vertical Clips",
        niche: "Podcasts",
        country: "United Kingdom",
        velocityScore: 88,
        searchGrowthPercent: 210,
        saturationLevel: "Low — Early Wave",
        recommendedHookAngle: "Put on headphones for 12 seconds to hear why spatial audio doubles retention...",
        sampleKeywords: ["spatial podcast", "retention audio trick", "lu-fs mastering"],
        history7d: [19, 25, 33, 42, 56, 72, 88],
      },
    ],
    risingCreators: [
      {
        id: "rc-1",
        channelName: "Kieran Builds AI",
        niche: "Technology",
        subscribers: 94000,
        avgViews30d: 610000,
        outlierMultiplier: 6.4,
        breakoutVideoTitle: "How One Autonomous Agent Replaced Our $40k/mo Content Agency Pipeline",
        breakoutVideoId: "M7lc1UVf-VE",
      },
      {
        id: "rc-2",
        channelName: "Cognitive Performance Lab",
        niche: "Education",
        subscribers: 240000,
        avgViews30d: 1420000,
        outlierMultiplier: 5.9,
        breakoutVideoTitle: "Why Neuroscientists Say 90-Minute Deep Work Blocks Rewire Dopamine Receptors",
        breakoutVideoId: "dQw4w9WgXcQ",
      },
      {
        id: "rc-3",
        channelName: "FinTech & Media Breakdown",
        niche: "Business",
        subscribers: 185000,
        avgViews30d: 960000,
        outlierMultiplier: 5.2,
        breakoutVideoTitle: "The Unspoken Economics of High-Retention Short Form Video in 2026",
        breakoutVideoId: "ysz5S6PUM-U",
      },
    ],
    podcastMoments: [
      {
        id: "pm-1",
        podcastName: "Creator Intelligence Lab",
        episodeTitle: "Ep. 142 — Retention Velocity & Algorithmic Distribution",
        guestName: "Alex Hormozi & Sarah Chen",
        youtubeVideoId: "M7lc1UVf-VE",
        timestampRange: "00:17 - 00:38",
        quoteHook: "Stop starting videos with 'hey guys welcome back'! Start in the middle of the highest conflict idea.",
        viralPotential: 97,
        topic: "Hook Architecture",
      },
      {
        id: "pm-2",
        podcastName: "Silicon Valley Dispatch",
        episodeTitle: "Ep. 89 — Why 99% of AI Wrappers Lose to Workflow Moats",
        guestName: "Devon Brooks",
        youtubeVideoId: "aqz-KE-bpKQ",
        timestampRange: "00:00 - 00:22",
        quoteHook: "99% of people building AI startups right now are solving a problem that models will automate next quarter.",
        viralPotential: 94,
        topic: "AI Startup Strategy",
      },
      {
        id: "pm-3",
        podcastName: "Mumbai Founder Podcast",
        episodeTitle: "Ep. 214 — Regional Language Shorts Monetization",
        guestName: "Rohan Verma",
        youtubeVideoId: "aqz-KE-bpKQ",
        timestampRange: "18:10 - 18:45",
        quoteHook: "Multilingual auto-dubbed clips increased our RPM by 340% overnight because US/UK audiences watched the same story.",
        viralPotential: 92,
        topic: "Global Localization",
      },
    ],
    trendingKeywords: [
      { keyword: "retention velocity", volumeIndex: 98, growthPercent: 340, competition: "Low", niche: "Creator Economy" },
      { keyword: "agentic video editor", volumeIndex: 94, growthPercent: 410, competition: "Low", niche: "AI Tools" },
      { keyword: "hormozi subtitle preset", volumeIndex: 91, growthPercent: 185, competition: "Medium", niche: "Video Editing" },
      { keyword: "dopamine reset protocol", volumeIndex: 89, growthPercent: 275, competition: "Low", niche: "Self Improvement" },
      { keyword: "micro saas distribution", volumeIndex: 87, growthPercent: 230, competition: "Medium", niche: "Business" },
      { keyword: "speaker diarization 9:16", volumeIndex: 84, growthPercent: 195, competition: "Low", niche: "Podcasting" },
    ],
  };

  const brandKit: BrandKitConfig = {
    id: "bk-default",
    name: "VYRAL Studio Pro",
    primaryColor: "#8B5CF6",
    secondaryColor: "#38BDF8",
    accentColor: "#FACC15",
    defaultFont: "Montserrat",
    watermarkText: "@vyral.studio",
    watermarkOpacity: 0.78,
    watermarkPosition: "top-right",
    defaultPresetId: "hormozi-bold",
    defaultAspectRatio: "9:16",
    preferredFraming: "active-speaker",
    introText: "High-Signal Breakdown",
    outroEnabled: true,
    outroText: "Follow for daily high-signal insights",
  };

  const brandProfiles: BrandKitConfig[] = [
    brandKit,
    {
      id: "bk-podcast",
      name: "Founder Podcast Split-Screen",
      primaryColor: "#10B981",
      secondaryColor: "#3B82F6",
      accentColor: "#FBBF24",
      defaultFont: "Inter",
      watermarkText: "@founder.podcast",
      watermarkOpacity: 0.7,
      watermarkPosition: "bottom-right",
      defaultPresetId: "podcast-speaker",
      defaultAspectRatio: "9:16",
      preferredFraming: "split-screen-podcast",
      introText: "Episode Highlight",
      outroEnabled: true,
      outroText: "Full episode linked in description",
    },
    {
      id: "bk-keynote",
      name: "Minimal Tech Keynote",
      primaryColor: "#38BDF8",
      secondaryColor: "#818CF8",
      accentColor: "#F8FAFC",
      defaultFont: "Geist",
      watermarkText: "@vyral.tech",
      watermarkOpacity: 0.65,
      watermarkPosition: "top-left",
      defaultPresetId: "clean-professional",
      defaultAspectRatio: "16:9",
      preferredFraming: "cinematic-center",
      introText: "Keynote Insight",
      outroEnabled: false,
      outroText: "",
    },
  ];

  const abExperiments: ABExperiment[] = [
    {
      id: "ab-101",
      clipId: allClips[0]?.id || "clip-proj-101-1",
      clipTitle: allClips[0]?.title || "Retention Velocity vs Raw Views",
      name: "Curiosity Hook vs Negative Warning Title Test",
      status: "insufficient_data",
      createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
      testPeriodDays: 7,
      variantA: {
        title: "Why Retention Velocity Changes Everything",
        thumbnailText: "RETENTION SECRET",
        views: null,
        impressions: null,
        ctrPercent: null,
        avgWatchTimeSec: null,
      },
      variantB: {
        title: "The Biggest Mistake Creators Make With Views",
        thumbnailText: "99% MISS THIS RULE",
        views: null,
        impressions: null,
        ctrPercent: null,
        avgWatchTimeSec: null,
      },
      winner: "undetermined",
      notes:
        "Manual tracking experiment created. Log actual published impressions & CTR from YouTube Studio or connect YouTube Analytics OAuth to determine a statistically significant winner.",
    },
  ];

  const calendarItems: CalendarScheduleItem[] = [
    {
      id: "cal-1",
      clipId: allClips[0]?.id || "clip-proj-101-1",
      clipTitle: allClips[0]?.title || "The biggest mistake creators make is optimizing for views",
      projectTitle: "The Science of 100M Views: Retention Velocity & AI Storytelling",
      platform: "YouTube Shorts",
      status: "scheduled",
      scheduledFor: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      topic: "Retention Velocity",
      niche: "Creator Economy",
      campaign: "Q4 Viral Shorts Sprint",
      visibility: "public",
      notes: "Primary 9:16 vertical export with Hormozi Bold captions & pinned comment #1.",
    },
    {
      id: "cal-2",
      clipId: allClips[1]?.id || "clip-proj-101-2",
      clipTitle: allClips[1]?.title || "Stop starting videos with hey guys welcome back",
      projectTitle: "The Science of 100M Views: Retention Velocity & AI Storytelling",
      platform: "YouTube Shorts",
      status: "published",
      scheduledFor: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      topic: "Hook Architecture",
      niche: "Creator Economy",
      campaign: "Q4 Viral Shorts Sprint",
      visibility: "public",
      notes: "Published with MrBeast Dynamic preset.",
      publishedUrl: "https://youtube.com/shorts/M7lc1UVf-VE",
    },
    {
      id: "cal-3",
      clipId: allClips[5]?.id || "clip-proj-102-1",
      clipTitle: allClips[5]?.title || "99% of people building AI startups right now",
      projectTitle: "Why 99% of AI SaaS Startups Fail Distribution (Founder Deep Dive)",
      platform: "Instagram Reels",
      status: "queued",
      scheduledFor: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      topic: "AI Startup Moats",
      niche: "Technology & SaaS",
      campaign: "Founder Alpha Series",
      visibility: "public",
      notes: "Ready in Publishing Queue for cross-platform Reels release.",
    },
    {
      id: "cal-4",
      clipId: allClips[2]?.id || "clip-proj-101-3",
      clipTitle: allClips[2]?.title || "Build an open curiosity loop",
      projectTitle: "The Science of 100M Views: Retention Velocity & AI Storytelling",
      platform: "TikTok",
      status: "draft",
      scheduledFor: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      topic: "Storytelling Loops",
      niche: "Creator Economy",
      campaign: "Q4 Viral Shorts Sprint",
      visibility: "public",
      notes: "Reviewing opening 0–3s hook overlay in Publishing Studio.",
    },
  ];

  const settings: PlatformSettings = {
    youtubeApiKeyConfigured: Boolean(process.env.YOUTUBE_API_KEY),
    geminiApiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    youtubeOAuthConnected: false,
    youtubeChannelTitle: null,
    ffmpegAvailable: true,
    hardwareAcceleration: "Apple Silicon ARM64 VideoToolbox + NEON (FFmpeg 9.0.1)",
    defaultExportFormat: "mp4_h264_aac",
    autoDeleteSourceAfterDays: 30,
    webhookUrl: "https://api.yourdomain.com/webhooks/vyral",
  };

  const hydratedClips = allClips.map((c) => {
    const proj = projects.find((p) => p.id === c.projectId);
    return {
      ...c,
      editorSettings: {
        ...c.editorSettings,
        watermarkText: "@vyral.ai",
      },
      publishingPackage: generateCompletePublishingPackage({
        clip: c,
        project: proj,
        trendingVideos,
        viralRadar,
      }),
    };
  });

  return {
    projects,
    clips: hydratedClips,
    jobs,
    trendingVideos,
    viralRadar,
    brandKit,
    brandProfiles,
    settings,
    winningTitles: [],
    abExperiments,
    calendarItems,
  };
}

export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const seed = buildInitialSeed();
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), "utf-8");
      return seed;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as DatabaseSchema;
    const fallbackSeed = buildInitialSeed();

    // Safe migration: upgrade any legacy branding & ensure every clip has a publishingPackage
    let mutated = false;
    if (parsed.brandKit?.name?.toLowerCase().includes("clipviral")) {
      parsed.brandKit.name = "VYRAL Studio Pro";
      mutated = true;
    }
    if (parsed.brandKit?.watermarkText?.toLowerCase().includes("clipviral")) {
      parsed.brandKit.watermarkText = "@vyral.studio";
      mutated = true;
    }
    if (parsed.settings?.webhookUrl?.includes("clipviral")) {
      parsed.settings.webhookUrl = "https://api.yourdomain.com/webhooks/vyral";
      mutated = true;
    }
    if (!parsed.brandProfiles || parsed.brandProfiles.length === 0) {
      parsed.brandProfiles = fallbackSeed.brandProfiles;
      mutated = true;
    }
    if (!parsed.abExperiments) {
      parsed.abExperiments = fallbackSeed.abExperiments;
      mutated = true;
    }
    if (!parsed.calendarItems) {
      parsed.calendarItems = fallbackSeed.calendarItems;
      mutated = true;
    }
    if ((parsed.trendingVideos || []).length < 8) {
      parsed.trendingVideos = fallbackSeed.trendingVideos;
      mutated = true;
    }

    parsed.clips = (parsed.clips || []).map((c) => {
      let updatedClip = c;
      if (c.editorSettings?.watermarkText?.toLowerCase().includes("clipviral")) {
        updatedClip = {
          ...updatedClip,
          editorSettings: {
            ...updatedClip.editorSettings,
            watermarkText: "@vyral.ai",
          },
        };
        mutated = true;
      }
      if (!updatedClip.publishingPackage) {
        const proj = parsed.projects.find((p) => p.id === updatedClip.projectId);
        updatedClip = {
          ...updatedClip,
          publishingPackage: generateCompletePublishingPackage({
            clip: updatedClip,
            project: proj,
            trendingVideos: parsed.trendingVideos || [],
            viralRadar: parsed.viralRadar,
          }),
        };
        mutated = true;
      }
      return updatedClip;
    });

    if (!parsed.winningTitles) {
      parsed.winningTitles = [];
    }

    const hasYtKey = Boolean(process.env.YOUTUBE_API_KEY?.trim());
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY?.trim());
    if (
      parsed.settings.youtubeApiKeyConfigured !== hasYtKey ||
      parsed.settings.geminiApiKeyConfigured !== hasGeminiKey
    ) {
      parsed.settings.youtubeApiKeyConfigured = hasYtKey;
      parsed.settings.geminiApiKeyConfigured = hasGeminiKey;
      mutated = true;
    }

    if (mutated) {
      writeDb(parsed);
    }

    return parsed;
  } catch {
    const seed = buildInitialSeed();
    return seed;
  }
}

export function writeDb(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmpFile, DB_FILE);
}

const BACKUP_DIR = path.join(DATA_DIR, "backups");

export function resetDbToSeed(): DatabaseSchema {
  const seed = buildInitialSeed();
  writeDb(seed);
  return seed;
}

export function createDbBackup(label = "manual"): {
  fileName: string;
  filePath: string;
  createdAt: string;
  sizeBytes: number;
} {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  const current = readDb();
  const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, "");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `vyral-backup-${safeLabel}-${stamp}.json`;
  const filePath = path.join(BACKUP_DIR, fileName);
  const serialized = JSON.stringify(current, null, 2);
  fs.writeFileSync(filePath, serialized, "utf-8");
  return {
    fileName,
    filePath,
    createdAt: new Date().toISOString(),
    sizeBytes: Buffer.byteLength(serialized, "utf-8"),
  };
}

export function listDbBackups(): {
  fileName: string;
  createdAt: string;
  sizeBytes: number;
}[] {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((fileName) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, fileName));
      return {
        fileName,
        createdAt: stat.mtime.toISOString(),
        sizeBytes: stat.size,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function restoreDbBackup(fileName: string): DatabaseSchema {
  const safeName = path.basename(fileName);
  const fullPath = path.join(BACKUP_DIR, safeName);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Backup file not found: ${safeName}`);
  }
  const parsed = JSON.parse(fs.readFileSync(fullPath, "utf-8")) as DatabaseSchema;
  writeDb(parsed);
  return readDb();
}

export function getDbDiagnostics() {
  const db = readDb();
  const stat = fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE) : null;
  return {
    adapter: "atomic-json-repository",
    dbFilePath: DB_FILE,
    sizeBytes: stat?.size ?? 0,
    lastModifiedAt: stat?.mtime.toISOString() ?? null,
    counts: {
      projects: db.projects.length,
      clips: db.clips.length,
      jobs: db.jobs.length,
      trendingVideos: db.trendingVideos.length,
      calendarItems: db.calendarItems?.length ?? 0,
      abExperiments: db.abExperiments?.length ?? 0,
      winningTitles: db.winningTitles?.length ?? 0,
      brandProfiles: db.brandProfiles?.length ?? 1,
    },
    backups: listDbBackups(),
  };
}

export { computeSnapshotMetrics, SAMPLE_TRANSCRIPT_1, SAMPLE_TRANSCRIPT_2, DB_FILE, DATA_DIR };
