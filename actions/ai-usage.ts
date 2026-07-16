"use server";

import { ValidationError } from "@/types/errors";
import cuid from "cuid";
import { z } from "zod";
import fs from "fs";
import path from "path";

const LOCAL_DATA_DIR = path.join(process.cwd(), "LOCAL_DATA");
const AI_USAGE_FILE = path.join(LOCAL_DATA_DIR, "ai_usage.json");

function ensureLocalDataDir() {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
}

function readAIUsageFromFile(): any[] {
  ensureLocalDataDir();
  if (!fs.existsSync(AI_USAGE_FILE)) {
    fs.writeFileSync(AI_USAGE_FILE, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const data = fs.readFileSync(AI_USAGE_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return parsed.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    }));
  } catch (error) {
    console.error("Failed to read local AI usage:", error);
    return [];
  }
}

function writeAIUsageToFile(items: any[]) {
  ensureLocalDataDir();
  fs.writeFileSync(AI_USAGE_FILE, JSON.stringify(items, null, 2));
}

const getDaysSinceEpoch = (daysAgo: number = 0) =>
  Math.floor(Date.now() / (24 * 60 * 60 * 1000)) - daysAgo;

const recordUsageSchema = z.object({
  promptTokens: z.number().min(0).default(0),
  completionTokens: z.number().min(0).default(0),
  modelId: z.string(),
});

const timeframeSchema = z.union([z.literal("1d"), z.literal("7d"), z.literal("30d")]);
type Timeframe = z.infer<typeof timeframeSchema>;

interface UsageStats {
  requests: number;
  timeframe: Timeframe;
}

interface ChartDataPoint {
  daysSinceEpoch?: number;
  hoursSinceEpoch?: number;
  date: string;
  totalRequests: number;
}

export async function recordAIUsage(input: {
  modelId: string;
  promptTokens?: number;
  completionTokens?: number;
}) {
  try {
    const userId = "local-user";

    const validation = recordUsageSchema.safeParse(input);
    if (!validation.success) {
      throw new ValidationError("Invalid usage data", validation.error.format());
    }

    const { promptTokens, completionTokens, modelId } = validation.data;
    const daysSinceEpoch = getDaysSinceEpoch(0);

    const items = readAIUsageFromFile();
    const newItem = {
      id: cuid(),
      userId,
      modelId,
      promptTokens: promptTokens.toString(),
      completionTokens: completionTokens.toString(),
      daysSinceEpoch: daysSinceEpoch.toString(),
      createdAt: new Date(),
    };

    items.push(newItem);
    writeAIUsageToFile(items);

    return newItem;
  } catch (error) {
    console.error("Error recording usage:", error);
    throw error;
  }
}

export async function getMyUsageStats(timeframe: Timeframe): Promise<UsageStats> {
  try {
    const userId = "local-user";
    const days = timeframe === "1d" ? 1 : timeframe === "7d" ? 7 : 30;
    const startDay = getDaysSinceEpoch(days);

    const items = readAIUsageFromFile();
    const events = items.filter(
      (item) => item.userId === userId && parseInt(item.daysSinceEpoch) >= startDay
    );

    return {
      requests: events.length,
      timeframe,
    };
  } catch (error) {
    console.error("Error getting usage stats:", error);
    throw error;
  }
}

export async function getMyAllTimeRequestCount(userId: string): Promise<number> {
  try {
    const items = readAIUsageFromFile();
    const userEvents = items.filter((item) => item.userId === userId);
    return userEvents.length;
  } catch (error) {
    console.error("Error getting all-time request count:", error);
    throw error;
  }
}

export async function getMyUsageChartData(timeframe: Timeframe): Promise<ChartDataPoint[]> {
  try {
    const userId = "local-user";
    const items = readAIUsageFromFile();

    if (timeframe === "1d") {
      const hours = 24;
      const startTime = Date.now() - hours * 60 * 60 * 1000;

      const events = items.filter(
        (e) => e.userId === userId && e.createdAt.getTime() >= startTime
      );

      const chartData: ChartDataPoint[] = [];
      for (let i = hours - 1; i >= 0; i--) {
        const hourStart = Date.now() - i * 60 * 60 * 1000;
        const hourEnd = Date.now() - (i - 1) * 60 * 60 * 1000;
        const hourEvents = events.filter(
          (e) => e.createdAt.getTime() >= hourStart && e.createdAt.getTime() < hourEnd
        );

        chartData.push({
          hoursSinceEpoch: Math.floor(hourStart / (60 * 60 * 1000)),
          date: new Date(hourStart).toISOString(),
          totalRequests: hourEvents.length,
        });
      }

      return chartData;
    }

    const days = timeframe === "7d" ? 7 : 30;
    const startDay = getDaysSinceEpoch(days);

    const events = items.filter(
      (e) => e.userId === userId && parseInt(e.daysSinceEpoch) >= startDay
    );

    const chartData: ChartDataPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const daysSince = getDaysSinceEpoch(i);
      const dayEvents = events.filter((e) => parseInt(e.daysSinceEpoch) === daysSince);

      chartData.push({
        daysSinceEpoch: daysSince,
        date: new Date(daysSince * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        totalRequests: dayEvents.length,
      });
    }

    return chartData;
  } catch (error) {
    console.error("Error getting usage chart data:", error);
    throw error;
  }
}

export async function getDetailedUsageStats(
  timeframe: Timeframe,
  modelId: string
): Promise<{
  requests: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timeframe: Timeframe;
}> {
  try {
    const userId = "local-user";
    const days = timeframe === "1d" ? 1 : timeframe === "7d" ? 7 : 30;
    const startDay = getDaysSinceEpoch(days);

    const items = readAIUsageFromFile();
    const events = items.filter(
      (e) =>
        e.userId === userId &&
        e.modelId === modelId &&
        parseInt(e.daysSinceEpoch) >= startDay
    );

    const requests = events.length;
    const promptTokens = events.reduce((sum, e) => sum + parseInt(e.promptTokens || "0"), 0);
    const completionTokens = events.reduce((sum, e) => sum + parseInt(e.completionTokens || "0"), 0);
    const totalTokens = promptTokens + completionTokens;

    return {
      requests,
      promptTokens,
      completionTokens,
      totalTokens,
      timeframe,
    };
  } catch (error) {
    console.error("Error getting detailed usage stats:", error);
    throw error;
  }
}
