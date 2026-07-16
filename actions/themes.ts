"use server";

import { z } from "zod";
import cuid from "cuid";
import fs from "fs";
import path from "path";
import { themeStylesSchema, type ThemeStyles } from "@/types/theme";
import { cache } from "react";
import {
  UnauthorizedError,
  ValidationError,
  ThemeNotFoundError,
  ErrorCode,
  actionError,
  actionSuccess,
  type ActionResult,
} from "@/types/errors";

const LOCAL_DATA_DIR = path.join(process.cwd(), "LOCAL_DATA");
const THEMES_FILE = path.join(LOCAL_DATA_DIR, "themes.json");

function ensureLocalDataDir() {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
}

function readThemesFromFile(): any[] {
  ensureLocalDataDir();
  if (!fs.existsSync(THEMES_FILE)) {
    fs.writeFileSync(THEMES_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const data = fs.readFileSync(THEMES_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return parsed.map((theme: any) => ({
      ...theme,
      createdAt: new Date(theme.createdAt),
      updatedAt: new Date(theme.updatedAt),
    }));
  } catch (error) {
    console.error("Failed to read local themes:", error);
    return [];
  }
}

function writeThemesToFile(themes: any[]) {
  ensureLocalDataDir();
  fs.writeFileSync(THEMES_FILE, JSON.stringify(themes, null, 2));
}

// Helper to get user ID with better error handling (mocked for offline use)
async function getCurrentUserId(): Promise<string> {
  return "local-user";
}

// Log errors for observability
function logError(error: Error, context: Record<string, any>) {
  console.error("Theme action error:", error, context);
}

const createThemeSchema = z.object({
  name: z.string().min(1, "Theme name cannot be empty").max(50, "Theme name too long"),
  styles: themeStylesSchema,
});

const updateThemeSchema = z.object({
  id: z.string().min(1, "Theme ID required"),
  name: z.string().min(1, "Theme name cannot be empty").max(50, "Theme name too long").optional(),
  styles: themeStylesSchema.optional(),
});

export async function getThemes() {
  try {
    return readThemesFromFile();
  } catch (error) {
    logError(error as Error, { action: "getThemes" });
    throw error;
  }
}

export const getTheme = cache(async (themeId: string) => {
  try {
    if (!themeId) {
      throw new ValidationError("Theme ID required");
    }

    const themes = readThemesFromFile();
    const theme = themes.find((t) => t.id === themeId);

    if (!theme) {
      throw new ThemeNotFoundError();
    }

    return theme;
  } catch (error) {
    logError(error as Error, { action: "getTheme", themeId });
    throw error;
  }
});

export async function createTheme(formData: { name: string; styles: ThemeStyles }) {
  try {
    const userId = await getCurrentUserId();

    const validation = createThemeSchema.safeParse(formData);
    if (!validation.success) {
      throw new ValidationError("Invalid input", validation.error.format());
    }

    const { name, styles } = validation.data;
    const newThemeId = cuid();
    const now = new Date();

    const themes = readThemesFromFile();
    const newTheme = {
      id: newThemeId,
      userId: userId,
      name: name,
      styles: styles,
      createdAt: now,
      updatedAt: now,
      isPublished: false,
    };

    themes.push(newTheme);
    writeThemesToFile(themes);

    return actionSuccess(newTheme);
  } catch (error) {
    logError(error as Error, { action: "createTheme", formData: { name: formData.name } });
    throw error;
  }
}

export async function updateTheme(formData: { id: string; name?: string; styles?: ThemeStyles }) {
  try {
    const userId = await getCurrentUserId();

    const validation = updateThemeSchema.safeParse(formData);
    if (!validation.success) {
      throw new ValidationError("Invalid input", validation.error.format());
    }

    const { id: themeId, name, styles } = validation.data;

    if (!name && !styles) {
      throw new ValidationError("No update data provided");
    }

    const themes = readThemesFromFile();
    const index = themes.findIndex((t) => t.id === themeId);
    if (index === -1) {
      throw new ThemeNotFoundError("Theme not found");
    }

    const updatedTheme = {
      ...themes[index],
      ...(name && { name }),
      ...(styles && { styles }),
      updatedAt: new Date(),
    };

    themes[index] = updatedTheme;
    writeThemesToFile(themes);

    return updatedTheme;
  } catch (error) {
    logError(error as Error, { action: "updateTheme", themeId: formData.id });
    throw error;
  }
}

export async function deleteTheme(themeId: string) {
  try {
    const userId = await getCurrentUserId();

    if (!themeId) {
      throw new ValidationError("Theme ID required");
    }

    const themes = readThemesFromFile();
    const index = themes.findIndex((t) => t.id === themeId);
    if (index === -1) {
      throw new ThemeNotFoundError("Theme not found");
    }

    const [deletedTheme] = themes.splice(index, 1);
    writeThemesToFile(themes);

    return { id: deletedTheme.id, name: deletedTheme.name };
  } catch (error) {
    logError(error as Error, { action: "deleteTheme", themeId });
    throw error;
  }
}
