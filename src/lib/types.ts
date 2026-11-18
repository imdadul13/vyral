export type NavSectionId =
  // WORKSPACE
  | "overview"
  | "create-clips"
  | "my-projects"
  | "clip-library"
  // AI STUDIO
  | "clip-intelligence"
  | "subtitle-studio"
  | "video-editor"
  | "publishing-studio"
  | "brand-kit"
  // INTELLIGENCE
  | "trending-now"
  | "opportunity-radar"
  | "retention-intelligence"
  | "creator-insights"
  | "ab-testing-lab"
  // PUBLISHING
  | "content-calendar"
  | "publishing-queue"
  | "performance-tracker"
  // ACCOUNT
  | "settings"
  | "subscription"
  | "help-center"
  // Quick alias
  | "ai-assistant";

export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5";
export type VideoResolution = "720p" | "1080p" | "1440p" | "4K";
export type FrameRate = 24 | 25 | 30 | 50 | 60;
export type ClipStatus = "ready" | "processing" | "published" | "failed";

export type SubtitlePresetId =
  | "hormozi-bold"
  | "mrbeast-dynamic"
  | "minimal-cinematic"
  | "karaoke-highlight"
  | "animated-popup"
  | "clean-professional"
  | "podcast-speaker"
  | "gaming-neon"
  | "custom";

export interface SubtitleStyleConfig {
  presetId: SubtitlePresetId;
  fontFamily: "Inter" | "Montserrat" | "Roboto Condensed" | "Space Grotesk" | "Bebas Neue" | "Geist";
  fontSize: number;
  fontWeight: "600" | "700" | "800" | "900";
  textColor: string;
  highlightColor: string;
  secondaryHighlightColor: string;
  backgroundOpacity: number;
  backgroundColor: string;
  strokeWidth: number;
  strokeColor: string;
  shadowIntensity: "none" | "subtle" | "medium" | "heavy";
  animationStyle: "word-pop" | "karaoke-fill" | "slide-up" | "typewriter" | "none";
  animationSpeed?: "slow" | "normal" | "fast";
  lineSpacing: number;
  positionY: number;
  maxWordsPerLine: number;
  uppercase: boolean;
  emojiIntegration: boolean;
  speakerIdentification: boolean;
  language: string;
  translateTo: string | null;
  autoPunctuation: boolean;
}

export interface WordTimestamp {
  id: string;
  word: string;
  start: number;
  end: number;
  speaker: "Speaker 1" | "Speaker 2" | "Host";
  isFiller?: boolean;
  confidence: number;
  emoji?: string;
}

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker: "Speaker 1" | "Speaker 2" | "Host";
  energyScore: number;
}

export interface SmartEditorSettings {
  cropX: number;
  cropY: number;
  zoomScale: number;
  autoFaceTracking: boolean;
  activeSpeakerDetection: boolean;
  smartVerticalReframing: boolean;
  multiSpeakerLayout?: "single-track" | "split-screen-podcast" | "auto-switch";
  safeZoneOverlay: boolean;
  backgroundMode: "none" | "blur" | "cinema-dark" | "brand-gradient";
  backgroundBlurAmount: number;
  removeSilence: boolean;
  removeFillerWords: boolean;
  autoZoomKeyframes: boolean;
  transitionStyle: "cut" | "smooth-dissolve" | "whip-pan" | "zoom-punch";
  audioNormalization: boolean;
  backgroundMusicId: "none" | "cyber-pulse" | "lofi-focus" | "cinematic-tension" | "upbeat-creator";
  backgroundMusicVolume: number;
  watermarkEnabled: boolean;
  watermarkText: string;
  watermarkPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  watermarkOpacity: number;
}

export interface ViralScoreBreakdown {
  overall: number;
  hookStrength: number;
  retentionPotential: number;
  emotionalEngagement: number;
  shareability: number;
  curiosityScore: number;
  storytellingQuality: number;
  standaloneContext: number;
  endingStrength: number;
  controversyOrInsight: number;
}

export type TitleStyleCategory =
  | "Curiosity-Driven"
  | "Highly Clickable"
  | "Emotional"
  | "Educational"
  | "Storytelling"
  | "Unexpected Revelation"
  | "Question-Based"
  | "Bold Statement"
  | "Controversial"
  | "SEO-Focused";

export interface ViralTitleOption {
  id: string;
  text: string;
  style: TitleStyleCategory;
  potentialScore: number;
  curiosityScore: number;
  emotionalAppeal: number;
  searchRelevance: number;
  suggestedAudience: string;
  explanation: string;
  isAiRecommended: boolean;
  isFavorite: boolean;
}

export interface DescriptionVariations {
  shortAndPunchy: string;
  seoOptimized: string;
  conversational: string;
  selectedVariation: "shortAndPunchy" | "seoOptimized" | "conversational";
}

export type HashtagCategory =
  | "Broad Niche"
  | "Specific Topic"
  | "Community"
  | "Relevant Trending"
  | "Platform-Specific";

export interface SmartHashtagItem {
  tag: string;
  category: HashtagCategory;
  selected: boolean;
  reason: string;
  isVerifiedTrending: boolean;
}

export type SeoTagCategory =
  | "Primary Keywords"
  | "Secondary Keywords"
  | "Long-Tail Keywords"
  | "Related Search Phrases";

export interface SeoTagItem {
  id: string;
  tag: string;
  category: SeoTagCategory;
  searchIntent: "Informational" | "Discovery" | "High-Intent" | "Trend-Aligned";
}

export interface ViralHookAlternative {
  id: string;
  angle: string;
  overlayText: string;
  spokenLeadNote: string;
  projectedLift: string;
}

export interface ViralHookAnalysis {
  originalOpeningTranscript: string;
  openingStrength: number;
  curiosity: number;
  emotionalIntensity: number;
  clarity: number;
  attentionGrabbing: number;
  relevance: number;
  diagnosticSummary: string;
  keepOriginalOpening: boolean;
  activeOpeningTextHook: string;
  alternativeHooks: ViralHookAlternative[];
}

export interface ThumbnailFrameCandidate {
  id: string;
  timestamp: number;
  visualDescription: string;
  compositionScore: number;
  focalPointNote: string;
}

export interface ThumbnailConcept {
  id: string;
  format: "9:16_shorts" | "16:9_longform";
  headlineText: string;
  subBadgeText: string;
  colorScheme: string;
  layoutGuide: string;
  contrastNote: string;
}

export interface ThumbnailOptimization {
  recommendedTimestamp: number;
  frameCandidates: ThumbnailFrameCandidate[];
  shortThumbnailText: string;
  compositionLayout: string;
  concepts: ThumbnailConcept[];
  customUploadedImageUrl?: string;
  activeFormat: "9:16_shorts" | "16:9_longform";
}

export type PinnedCommentStyle =
  | "Engagement-Driven"
  | "Opinion-Based"
  | "Educational"
  | "Community-Building"
  | "CTA-Based";

export interface PinnedCommentOption {
  id: string;
  style: PinnedCommentStyle;
  text: string;
  rationale: string;
}

export type TargetPublishPlatform =
  | "youtube_shorts"
  | "instagram_reels"
  | "tiktok"
  | "youtube_longform";

export interface PlatformPublishingPackages {
  youtube_shorts: {
    title: string;
    description: string;
    hashtags: string[];
    seoTags: string[];
    coverText: string;
    pinnedComment: string;
    category: string;
    audienceRecommendation: string;
    checklist: { item: string; passed: boolean }[];
  };
  instagram_reels: {
    caption: string;
    hashtags: string[];
    openingText: string;
    cta: string;
    coverText: string;
    suggestedFormat: string;
  };
  tiktok: {
    shortCaption: string;
    searchKeywords: string[];
    hashtags: string[];
    openingHook: string;
    cta: string;
  };
  youtube_longform: {
    seoTitle: string;
    detailedDescription: string;
    chapters: { timestamp: string; label: string }[];
    tags: string[];
    thumbnailText: string;
    pinnedComment: string;
  };
}

export interface PublishingOptimizationScore {
  overall: number;
  titleQuality: number;
  descriptionQuality: number;
  searchOptimization: number;
  hashtagRelevance: number;
  hookStrength: number;
  thumbnailQuality: number;
  audienceAlignment: number;
  contentRelevance: number;
  deductionsAndFixes: {
    issue: string;
    impact: string;
    fixAction: string;
  }[];
}

export interface PublishingKitVersion {
  versionId: string;
  savedAt: string;
  selectedTitle: string;
  overallScore: number;
  targetPlatform: TargetPublishPlatform;
}

export interface VyralPublishingPackage {
  clipId: string;
  generatedAt: string;
  updatedAt: string;
  targetPlatform: TargetPublishPlatform;
  selectedTitleId: string;
  selectedTitleText: string;
  titles: ViralTitleOption[];
  descriptions: DescriptionVariations;
  hashtags: SmartHashtagItem[];
  seoTags: SeoTagItem[];
  hookAnalysis: ViralHookAnalysis;
  thumbnail: ThumbnailOptimization;
  pinnedComments: PinnedCommentOption[];
  selectedPinnedCommentId: string;
  platformPackages: PlatformPublishingPackages;
  optimizationScore: PublishingOptimizationScore;
  trendSignalsUsed: string[];
  versionHistory: PublishingKitVersion[];
}

export interface WinningTitleRecord {
  id: string;
  clipId?: string;
  titleText: string;
  style: TitleStyleCategory;
  publishedAt: string;
  platform: "YouTube Shorts" | "Instagram Reels" | "TikTok" | "YouTube Long-form";
  views: number | null;
  impressions: number | null;
  ctrPercent: number | null;
  avgViewDurationSec: number | null;
  retentionPercent: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  subscribersGained?: number | null;
  isVerifiedAnalytics?: boolean;
}

export interface ABExperiment {
  id: string;
  clipId: string;
  clipTitle: string;
  name: string;
  status: "running" | "completed" | "insufficient_data";
  createdAt: string;
  testPeriodDays: number;
  variantA: {
    title: string;
    thumbnailText: string;
    views: number | null;
    impressions: number | null;
    ctrPercent: number | null;
    avgWatchTimeSec: number | null;
  };
  variantB: {
    title: string;
    thumbnailText: string;
    views: number | null;
    impressions: number | null;
    ctrPercent: number | null;
    avgWatchTimeSec: number | null;
  };
  winner: "A" | "B" | "undetermined";
  notes: string;
}

export interface CalendarScheduleItem {
  id: string;
  clipId: string;
  clipTitle: string;
  projectTitle: string;
  platform: "YouTube Shorts" | "Instagram Reels" | "TikTok" | "YouTube Long-form";
  status: "draft" | "scheduled" | "queued" | "published";
  scheduledFor: string; // ISO date-time
  topic: string;
  niche: string;
  campaign: string;
  visibility: "public" | "unlisted" | "private";
  notes: string;
  publishedUrl?: string;
}

export interface GeneratedClip {
  id: string;
  projectId: string;
  projectTitle: string;
  youtubeVideoId: string;
  title: string;
  suggestedDescription: string;
  hashtags: string[];
  startTime: number;
  endTime: number;
  duration: number;
  aspectRatio: AspectRatio;
  resolution: VideoResolution;
  fps: FrameRate;
  viralScore: number;
  scoreBreakdown: ViralScoreBreakdown;
  momentCategory:
    | "High-Voltage Hook"
    | "Controversial Take"
    | "Storytelling Peak"
    | "Educational Insight"
    | "Emotional Moment"
    | "Unexpected Plot Twist"
    | "Founder Alpha";
  aiReasoning: string;
  retentionDropWarning?: string;
  subtitleStyle: SubtitleStyleConfig;
  words: WordTimestamp[];
  editorSettings: SmartEditorSettings;
  publishingPackage?: VyralPublishingPackage;
  status: ClipStatus;
  isFavorite: boolean;
  thumbnailUrl: string;
  sourceVideoUrl: string;
  renderedVideoUrl?: string;
  lastRenderedAt?: string;
  publishedPlatform?: "YouTube Shorts" | "Instagram Reels" | "TikTok" | "YouTube Landscape";
  publishedUrl?: string;
  createdAt: string;
}

export interface ClipGenerationConfig {
  clipCount: 3 | 5 | 10 | 15 | number;
  targetDuration: 15 | 30 | 45 | 60 | 90;
  aspectRatio: AspectRatio;
  resolution: VideoResolution;
  fps: FrameRate;
  language: string;
  subtitlePresetId: SubtitlePresetId;
  speakerTracking: boolean;
  autoReframing: boolean;
  backgroundEnhancement: boolean;
  ownershipConfirmed: boolean;
}

export interface VideoProject {
  id: string;
  youtubeVideoId: string;
  youtubeUrl: string;
  title: string;
  channelName: string;
  channelSubscribers: number;
  durationSeconds: number;
  thumbnailUrl: string;
  language: string;
  captionSource: "youtube_captions" | "whisper_fallback" | "user_upload";
  metadataSource: "youtube_data_api_v3" | "youtube_oembed_live" | "authorized_demo_media";
  status: "queued" | "transcribing" | "analyzing" | "rendering" | "completed" | "failed";
  avgViralScore: number;
  clipIds: string[];
  transcript: TranscriptSegment[];
  config: ClipGenerationConfig;
  createdAt: string;
}

export interface ProcessingJob {
  id: string;
  projectId: string;
  projectTitle: string;
  clipId?: string;
  jobType:
    | "ingest_metadata"
    | "speech_transcription"
    | "gemini_viral_analysis"
    | "ffmpeg_render"
    | "youtube_publish"
    | "vyral_publishing_kit";
  status: "queued" | "active" | "completed" | "failed" | "retrying";
  progress: number;
  workerNode: string;
  startedAt: string;
  logs: string[];
}

export interface ViewSnapshotPoint {
  observedAt: string;
  viewCount: number;
}

export type TrendingCategory =
  | "Gaming"
  | "Entertainment"
  | "Education"
  | "Technology"
  | "Podcasts"
  | "Business"
  | "News"
  | "Motivation"
  | "Sports";

export interface TrendingVideoItem {
  id: string;
  youtubeVideoId: string;
  youtubeUrl: string;
  title: string;
  channelName: string;
  channelSubscribers: number;
  thumbnailUrl: string;
  country: "India" | "United States" | "United Kingdom" | "Global";
  category: TrendingCategory;
  language: string;
  topic: string;
  uploadedAt: string;
  durationSeconds: number;
  currentViews: number;
  likes: number | null;
  comments: number | null;
  observationIntervalHours: number;
  snapshotCount: number;
  snapshots: ViewSnapshotPoint[];
  estimatedViewsPerHour: number;
  estimatedViewsPerDay: number;
  viewsToSubscriberRatio: number;
  engagementRate: number;
  growthLast1h: number;
  growthLast6h: number;
  growthLast24h: number;
  accelerationPercent: number;
  trendingOpportunityScore: number;
  outperformingChannelFactor: number;
  isLiveApiData: boolean;
}

export interface ViralRadarData {
  emergingTopics: {
    id: string;
    topic: string;
    niche: string;
    country: string;
    velocityScore: number;
    searchGrowthPercent: number;
    saturationLevel: "Low — Early Wave" | "Medium — Accelerating" | "High — Peak";
    recommendedHookAngle: string;
    sampleKeywords: string[];
    history7d: number[];
    sampleYoutubeUrl?: string;
  }[];
  risingCreators: {
    id: string;
    channelName: string;
    niche: string;
    subscribers: number;
    avgViews30d: number;
    outlierMultiplier: number;
    breakoutVideoTitle: string;
    breakoutVideoId: string;
  }[];
  podcastMoments: {
    id: string;
    podcastName: string;
    episodeTitle: string;
    guestName: string;
    youtubeVideoId: string;
    timestampRange: string;
    quoteHook: string;
    viralPotential: number;
    topic: string;
  }[];
  trendingKeywords: {
    keyword: string;
    volumeIndex: number;
    growthPercent: number;
    competition: "Low" | "Medium" | "High";
    niche: string;
  }[];
}

export interface BrandKitConfig {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  defaultFont: SubtitleStyleConfig["fontFamily"];
  watermarkText: string;
  watermarkOpacity: number;
  watermarkPosition: SmartEditorSettings["watermarkPosition"];
  defaultPresetId: SubtitlePresetId;
  defaultAspectRatio?: AspectRatio;
  preferredFraming?: "active-speaker" | "split-screen-podcast" | "cinematic-center";
  introText?: string;
  outroEnabled: boolean;
  outroText: string;
}

export interface PlatformSettings {
  youtubeApiKeyConfigured: boolean;
  geminiApiKeyConfigured: boolean;
  youtubeOAuthConnected: boolean;
  youtubeChannelTitle: string | null;
  ffmpegAvailable: boolean;
  hardwareAcceleration: string;
  defaultExportFormat: "mp4_h264_aac";
  autoDeleteSourceAfterDays: number;
  webhookUrl: string;
  onboardingCompleted?: boolean;
  creatorName?: string;
}

export interface DatabaseSchema {
  projects: VideoProject[];
  clips: GeneratedClip[];
  jobs: ProcessingJob[];
  trendingVideos: TrendingVideoItem[];
  viralRadar: ViralRadarData;
  brandKit: BrandKitConfig;
  brandProfiles?: BrandKitConfig[];
  settings: PlatformSettings;
  winningTitles?: WinningTitleRecord[];
  abExperiments?: ABExperiment[];
  calendarItems?: CalendarScheduleItem[];
}
