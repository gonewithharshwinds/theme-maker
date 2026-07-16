"use server";

import { actionSuccess, type ActionResult } from "@/types/errors";
import fs from "fs";
import path from "path";

export async function deleteAccount(): Promise<ActionResult<boolean>> {
  try {
    const LOCAL_DATA_DIR = path.join(process.cwd(), "LOCAL_DATA");
    const THEMES_FILE = path.join(LOCAL_DATA_DIR, "themes.json");
    const AI_USAGE_FILE = path.join(LOCAL_DATA_DIR, "ai_usage.json");

    if (fs.existsSync(THEMES_FILE)) {
      fs.writeFileSync(THEMES_FILE, JSON.stringify([], null, 2));
    }
    if (fs.existsSync(AI_USAGE_FILE)) {
      fs.writeFileSync(AI_USAGE_FILE, JSON.stringify([], null, 2));
    }

    return actionSuccess(true);
  } catch (error) {
    console.error("Error deleting local account data:", error);
    return actionSuccess(false);
  }
}
