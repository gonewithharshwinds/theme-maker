"use server";

import { z } from "zod";
import cuid from "cuid";
import {
  UnauthorizedError,
  ValidationError,
  ThemeNotFoundError,
  actionError,
  actionSuccess,
  type ActionResult,
} from "@/types/errors";
import {
  COMMUNITY_THEMES_PAGE_SIZE,
  COMMUNITY_THEME_TAGS,
  MAX_TAGS_PER_THEME,
} from "@/lib/constants";
import type {
  CommunityTheme,
  CommunitySortOption,
  CommunityFilterOption,
  CommunityTimeRange,
  CommunityThemesResponse,
} from "@/types/community";
import fs from "fs";
import path from "path";

const LOCAL_DATA_DIR = path.join(process.cwd(), "LOCAL_DATA");
const COMMUNITY_THEMES_FILE = path.join(LOCAL_DATA_DIR, "community_themes.json");

function ensureLocalDataDir() {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
}

function readCommunityThemes(): any[] {
  ensureLocalDataDir();
  if (!fs.existsSync(COMMUNITY_THEMES_FILE)) {
    fs.writeFileSync(COMMUNITY_THEMES_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const data = fs.readFileSync(COMMUNITY_THEMES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read local community themes:", error);
    return [];
  }
}

function writeCommunityThemes(themes: any[]) {
  ensureLocalDataDir();
  fs.writeFileSync(COMMUNITY_THEMES_FILE, JSON.stringify(themes, null, 2));
}

// Mock auth helpers
async function getOptionalUserId(): Promise<string | null> {
  return "local-user";
}

async function getCurrentUserId(): Promise<string> {
  return "local-user";
}

export async function getCommunityThemes(
  sort: CommunitySortOption = "popular",
  cursor?: string | number,
  limit: number = COMMUNITY_THEMES_PAGE_SIZE,
  filter: CommunityFilterOption = "all",
  tags: string[] = [],
  timeRange: CommunityTimeRange = "all"
): Promise<CommunityThemesResponse> {
  try {
    const allCommunityThemes = readCommunityThemes();
    // Filter & Sort mock
    let themes = [...allCommunityThemes];
    
    if (filter === "mine") {
      themes = themes.filter(t => t.author?.id === "local-user");
    }
    if (tags.length > 0) {
      themes = themes.filter(t => tags.every(tag => t.tags?.includes(tag)));
    }

    return {
      themes: themes.slice(0, limit),
      nextCursor: null
    };
  } catch (error) {
    console.error("Error getting community themes:", error);
    return { themes: [], nextCursor: null };
  }
}

export async function publishTheme(
  themeId: string,
  tags: string[] = []
): Promise<ActionResult<{ id: string }>> {
  try {
    const userId = await getCurrentUserId();
    const communityThemes = readCommunityThemes();
    
    // Check if already published
    if (communityThemes.some(t => t.themeId === themeId)) {
      return actionError("already_published" as any, "Already published");
    }

    const id = cuid();
    const newPublish = {
      id,
      themeId,
      name: "Local Published Theme",
      styles: {},
      author: {
        id: userId,
        name: "Local User",
        image: null
      },
      likeCount: 0,
      isLikedByMe: false,
      publishedAt: new Date().toISOString(),
      tags: tags
    };

    communityThemes.push(newPublish);
    writeCommunityThemes(communityThemes);

    return actionSuccess({ id });
  } catch (error) {
    return actionError("unknown_error" as any, "Failed to publish theme");
  }
}

export async function unpublishTheme(
  themeId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const communityThemes = readCommunityThemes();
    const filtered = communityThemes.filter(t => t.themeId !== themeId);
    writeCommunityThemes(filtered);
    return actionSuccess({ success: true });
  } catch (error) {
    return actionError("unknown_error" as any, "Failed to unpublish theme");
  }
}

export async function toggleLikeTheme(
  communityThemeId: string
): Promise<ActionResult<{ liked: boolean; likeCount: number }>> {
  try {
    const communityThemes = readCommunityThemes();
    const theme = communityThemes.find(t => t.id === communityThemeId);
    if (!theme) throw new ThemeNotFoundError();

    theme.isLikedByMe = !theme.isLikedByMe;
    theme.likeCount = theme.isLikedByMe ? theme.likeCount + 1 : Math.max(0, theme.likeCount - 1);

    writeCommunityThemes(communityThemes);
    return actionSuccess({ liked: theme.isLikedByMe, likeCount: theme.likeCount });
  } catch (error) {
    throw error;
  }
}

export async function getCommunityDataForTheme(
  themeId: string
): Promise<{
  communityThemeId: string;
  author: { id: string; name: string; image: string | null };
  likeCount: number;
  isLikedByMe: boolean;
  publishedAt: string;
  tags: string[];
} | null> {
  const communityThemes = readCommunityThemes();
  const theme = communityThemes.find(t => t.themeId === themeId);
  if (!theme) return null;

  return {
    communityThemeId: theme.id,
    author: theme.author,
    likeCount: theme.likeCount,
    isLikedByMe: theme.isLikedByMe,
    publishedAt: theme.publishedAt,
    tags: theme.tags || []
  };
}

export async function getMyPublishedThemeIds(): Promise<string[]> {
  const communityThemes = readCommunityThemes();
  return communityThemes.filter(t => t.author?.id === "local-user").map(t => t.themeId);
}

export async function updateCommunityThemeTags(
  themeId: string,
  tags: string[]
): Promise<ActionResult<{ tags: string[] }>> {
  const communityThemes = readCommunityThemes();
  const theme = communityThemes.find(t => t.themeId === themeId);
  if (theme) {
    theme.tags = tags;
    writeCommunityThemes(communityThemes);
  }
  return actionSuccess({ tags });
}

export async function getCommunityTagCounts(): Promise<
  { tag: string; count: number }[]
> {
  const communityThemes = readCommunityThemes();
  const counts: Record<string, number> = {};
  for (const t of communityThemes) {
    for (const tag of t.tags || []) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return Object.entries(counts).map(([tag, count]) => ({ tag, count }));
}
