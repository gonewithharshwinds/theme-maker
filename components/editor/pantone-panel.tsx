"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, Check, Copy, Maximize2, Upload, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import pantoneDataRaw from "../../pantone-colors-master/pantone-numbers.json";

// Type definition for parsed pantone color
interface PantoneColor {
  number: string;
  name: string;
  formattedName: string;
  hex: string;
}

// Cast raw data to typed record
const pantoneData = pantoneDataRaw as Record<string, { name: string; hex: string }>;

// Helper to calculate best text contrast (black or white) for a background HEX
function getContrastClass(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 135 ? "text-slate-950/80 font-medium" : "text-white/95 font-medium";
}

// Convert kebab-case names to English Title Case
function toTitleCase(str: string): string {
  return str
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Grid column class dictionary (Tailwind static analysis safety)
const gridColsClassMap: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  8: "grid-cols-8",
  10: "grid-cols-10",
  12: "grid-cols-12",
};

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface HslColor {
  h: number;
  s: number;
  l: number;
}

function hexToRgb(hex: string): RgbColor {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b };
}

function rgbToHsl(r: number, g: number, b: number): HslColor {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Semantic Color matchers and rank scorers (100% color-based search)
const SEMANTIC_COLORS: Record<string, {
  match: (rgb: RgbColor, hsl: HslColor) => boolean;
  score: (rgb: RgbColor, hsl: HslColor) => number;
}> = {
  blue: {
    match: (rgb, hsl) => rgb.b >= 128 && hsl.h >= 170 && hsl.h <= 265,
    score: (rgb, hsl) => {
      const hueDiff = Math.abs(hsl.h - 240);
      return hsl.s * 2 + (100 - hueDiff) + (hsl.l > 30 && hsl.l < 70 ? 50 : 0);
    }
  },
  red: {
    match: (rgb, hsl) => rgb.r >= 128 && (hsl.h <= 20 || hsl.h >= 340),
    score: (rgb, hsl) => {
      const hueDiff = hsl.h > 180 ? Math.abs(hsl.h - 360) : hsl.h;
      return hsl.s * 2 + (20 - hueDiff) + (hsl.l > 30 && hsl.l < 70 ? 50 : 0);
    }
  },
  green: {
    match: (rgb, hsl) => rgb.g >= 128 && hsl.h >= 80 && hsl.h <= 160,
    score: (rgb, hsl) => {
      const hueDiff = Math.abs(hsl.h - 120);
      return hsl.s * 2 + (100 - hueDiff) + (hsl.l > 30 && hsl.l < 70 ? 50 : 0);
    }
  },
  yellow: {
    match: (rgb, hsl) => rgb.r >= 128 && rgb.g >= 128 && hsl.h >= 45 && hsl.h <= 65,
    score: (rgb, hsl) => {
      const hueDiff = Math.abs(hsl.h - 60);
      return hsl.s * 2 + (100 - hueDiff) + (hsl.l > 30 && hsl.l < 70 ? 50 : 0);
    }
  },
  orange: {
    match: (rgb, hsl) => rgb.r >= 128 && rgb.g >= 80 && hsl.h >= 20 && hsl.h <= 45,
    score: (rgb, hsl) => {
      const hueDiff = Math.abs(hsl.h - 30);
      return hsl.s * 2 + (100 - hueDiff) + (hsl.l > 30 && hsl.l < 70 ? 50 : 0);
    }
  },
  purple: {
    match: (rgb, hsl) => rgb.r >= 80 && rgb.b >= 128 && hsl.h >= 265 && hsl.h <= 320,
    score: (rgb, hsl) => {
      const hueDiff = Math.abs(hsl.h - 290);
      return hsl.s * 2 + (100 - hueDiff) + (hsl.l > 30 && hsl.l < 70 ? 50 : 0);
    }
  },
  pink: {
    match: (rgb, hsl) => rgb.r >= 128 && rgb.b >= 100 && hsl.h >= 300 && hsl.h <= 350,
    score: (rgb, hsl) => {
      const hueDiff = Math.abs(hsl.h - 330);
      return hsl.s * 2 + (100 - hueDiff) + (hsl.l > 30 && hsl.l < 70 ? 50 : 0);
    }
  },
  teal: {
    match: (rgb, hsl) => rgb.g >= 80 && rgb.b >= 80 && hsl.h >= 150 && hsl.h <= 200,
    score: (rgb, hsl) => {
      const hueDiff = Math.abs(hsl.h - 175);
      return hsl.s * 2 + (100 - hueDiff) + (hsl.l > 30 && hsl.l < 70 ? 50 : 0);
    }
  }
};

// Color Psychology / Naming Concept bounds for smart semantic search
const CONCEPT_COLORS: Record<string, { h?: [number, number]; s?: [number, number]; l?: [number, number] }> = {
  bone: { h: [20, 60], s: [0, 25], l: [70, 95] },       // Creamy off-whites
  snow: { h: [0, 360], s: [0, 10], l: [90, 100] },      // Pure whites
  gold: { h: [40, 55], s: [40, 100], l: [40, 75] },     // Golden yellow/orange
  rust: { h: [10, 35], s: [35, 90], l: [20, 50] },      // Reddish browns
  chocolate: { h: [10, 35], s: [10, 50], l: [10, 35] }, // Dark browns
  rose: { h: [320, 360], s: [30, 100], l: [30, 80] },    // Pinks and soft reds
  emerald: { h: [120, 160], s: [40, 100], l: [20, 60] }, // Deep greens
  sky: { h: [190, 220], s: [20, 100], l: [50, 90] },    // Sky blues
  navy: { h: [200, 240], s: [40, 100], l: [5, 30] },     // Navy blues
  cream: { h: [30, 60], s: [5, 35], l: [80, 98] },      // Soft yellow-whites
  peach: { h: [15, 35], s: [30, 80], l: [65, 90] },     // Light orange-pinks
  mint: { h: [120, 170], s: [15, 60], l: [60, 90] },    // Mint greens
};

function getConceptScore(color: PantoneColor, query: string): number {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/);
  for (const word of words) {
    const concept = CONCEPT_COLORS[word];
    if (concept) {
      const rgb = hexToRgb(color.hex);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      let matches = true;
      if (concept.h && (hsl.h < concept.h[0] || hsl.h > concept.h[1])) matches = false;
      if (concept.s && (hsl.s < concept.s[0] || hsl.s > concept.s[1])) matches = false;
      if (concept.l && (hsl.l < concept.l[0] || hsl.l > concept.l[1])) matches = false;
      if (matches) {
        return 2500; // Big boost to align semantic expectations (e.g. Bone White over Bone Brown)
      }
    }
  }
  return 0;
}

// Color extractor worker
function extractColorsFromImage(
  imageElement: HTMLImageElement,
  allPantoneColors: PantoneColor[],
  onComplete: (colorsWithStats: { color: PantoneColor; count: number }[]) => void
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const maxDim = 150;
  let w = imageElement.naturalWidth;
  let h = imageElement.naturalHeight;
  if (w > h) {
    if (w > maxDim) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    }
  } else {
    if (h > maxDim) {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(imageElement, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Sample pixel data (skipping transparent pixels, group colors)
  const colorMap = new Map<string, number>();
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 128) continue;

    // Group close colors by dividing into buckets of 16
    const bucket = `${Math.round(r / 16) * 16},${Math.round(g / 16) * 16},${Math.round(b / 16) * 16}`;
    colorMap.set(bucket, (colorMap.get(bucket) || 0) + 1);
  }

  const sortedBuckets = Array.from(colorMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 80);

  const matchedPantonesMap = new Map<string, { color: PantoneColor; count: number }>();
  sortedBuckets.forEach(([bucket, count]) => {
    const [br, bg, bb] = bucket.split(",").map(Number);
    let minDistance = Infinity;
    let nearestColor: PantoneColor | null = null;

    allPantoneColors.forEach((pColor) => {
      const pRgb = hexToRgb(pColor.hex);
      const dist =
        Math.pow(br - pRgb.r, 2) +
        Math.pow(bg - pRgb.g, 2) +
        Math.pow(bb - pRgb.b, 2);
      if (dist < minDistance) {
        minDistance = dist;
        nearestColor = pColor;
      }
    });

    if (nearestColor) {
      const existing = matchedPantonesMap.get((nearestColor as PantoneColor).number);
      if (existing) {
        existing.count += count;
      } else {
        matchedPantonesMap.set((nearestColor as PantoneColor).number, { color: nearestColor, count });
      }
    }
  });

  const result = Array.from(matchedPantonesMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  onComplete(result);
}

export function PantonePanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(60);
  
  // Selection & Modal States
  const [selectedColors, setSelectedColors] = useState<PantoneColor[]>([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [colsPerRow, setColsPerRow] = useState(6);
  const [modalVisibleCount, setModalVisibleCount] = useState(100);
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);

  // Modal Sub-Modes: "search" | "image"
  const [modalMode, setModalMode] = useState<"search" | "image">("search");

  // Image Extractor States
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [extractedPantones, setExtractedPantones] = useState<{ color: PantoneColor; count: number }[]>([]);
  const [numColorsToExtract, setNumColorsToExtract] = useState(5);
  const [extractionFilter, setExtractionFilter] = useState<"popular" | "rare" | "lightest" | "darkest" | "saturated" | "desaturated">("popular");

  // Parse and cache the Pantone list in original order
  const allColors = useMemo<PantoneColor[]>(() => {
    return Object.entries(pantoneData).map(([number, color]) => ({
      number,
      name: color.name,
      formattedName: toTitleCase(color.name),
      hex: `#${color.hex}`,
    }));
  }, []);

  // Filter and rank colors based on search query, text scoring, semantic terms and concepts
  const filteredColors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allColors;

    // Detect if the query matches one of our semantic color names
    const semanticKey = Object.keys(SEMANTIC_COLORS).find(
      (key) => query.includes(key)
    );
    const semantic = semanticKey ? SEMANTIC_COLORS[semanticKey] : null;

    const scored = allColors
      .map((color) => {
        let score = 0;
        const nameLower = color.name.toLowerCase();
        const numberLower = color.number.toLowerCase();
        const hexLower = color.hex.toLowerCase();

        // 1. Text Matching
        if (nameLower === query) {
          score += 2000;
        } else if (nameLower.startsWith(query)) {
          score += 1000;
        } else if (nameLower.includes(query)) {
          score += 500;
        }

        if (numberLower.includes(query)) {
          score += 800;
        }
        if (hexLower.includes(query)) {
          score += 600;
        }

        // 2. Semantic Color Matching (e.g. searching "blue" gets real blue colors, sorted by purity)
        if (semantic) {
          const rgb = hexToRgb(color.hex);
          const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
          if (semantic.match(rgb, hsl)) {
            const purity = semantic.score(rgb, hsl);
            score += 1500 + purity;
          }
        }

        // 3. NLP Color Psychology concepts (e.g. "bone" boosts cream hues over brown hues)
        score += getConceptScore(color, query);

        return { color, score };
      })
      .filter((item) => item.score > 0);

    // Sort by score descending
    return scored
      .sort((a, b) => b.score - a.score)
      .map((item) => item.color);
  }, [allColors, searchQuery]);

  // Process and sort extracted colors from image
  const processedExtractedColors = useMemo(() => {
    if (extractedPantones.length === 0) return [];
    const items = [...extractedPantones];

    switch (extractionFilter) {
      case "popular":
        items.sort((a, b) => b.count - a.count);
        break;
      case "rare":
        items.sort((a, b) => a.count - b.count);
        break;
      case "lightest":
        items.sort((a, b) => {
          const rgbA = hexToRgb(a.color.hex);
          const hslA = rgbToHsl(rgbA.r, rgbA.g, rgbA.b);
          const rgbB = hexToRgb(b.color.hex);
          const hslB = rgbToHsl(rgbB.r, rgbB.g, rgbB.b);
          return hslB.l - hslA.l;
        });
        break;
      case "darkest":
        items.sort((a, b) => {
          const rgbA = hexToRgb(a.color.hex);
          const hslA = rgbToHsl(rgbA.r, rgbA.g, rgbA.b);
          const rgbB = hexToRgb(b.color.hex);
          const hslB = rgbToHsl(rgbB.r, rgbB.g, rgbB.b);
          return hslA.l - hslB.l;
        });
        break;
      case "saturated":
        items.sort((a, b) => {
          const rgbA = hexToRgb(a.color.hex);
          const hslA = rgbToHsl(rgbA.r, rgbA.g, rgbA.b);
          const rgbB = hexToRgb(b.color.hex);
          const hslB = rgbToHsl(rgbB.r, rgbB.g, rgbB.b);
          return hslB.s - hslA.s;
        });
        break;
      case "desaturated":
        items.sort((a, b) => {
          const rgbA = hexToRgb(a.color.hex);
          const hslA = rgbToHsl(rgbA.r, rgbA.g, rgbA.b);
          const rgbB = hexToRgb(b.color.hex);
          const hslB = rgbToHsl(rgbB.r, rgbB.g, rgbB.b);
          return hslA.s - hslB.s;
        });
        break;
    }

    return items.slice(0, numColorsToExtract).map((item) => item.color);
  }, [extractedPantones, extractionFilter, numColorsToExtract]);

  // Reset pagination when search changes
  useEffect(() => {
    setVisibleCount(60);
    setModalVisibleCount(100);
  }, [searchQuery]);

  // Infinite scroll trigger for sidebar
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
      if (visibleCount < filteredColors.length) {
        setVisibleCount((prev) => Math.min(prev + 60, filteredColors.length));
      }
    }
  };

  // Infinite scroll trigger for maximized modal
  const handleModalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 150) {
      if (modalVisibleCount < filteredColors.length) {
        setModalVisibleCount((prev) => Math.min(prev + 100, filteredColors.length));
      }
    }
  };

  // Selection toggle logic
  const toggleSelectColor = (color: PantoneColor) => {
    let updated: PantoneColor[];
    const isSelected = selectedColors.some((c) => c.number === color.number);
    
    if (isSelected) {
      updated = selectedColors.filter((c) => c.number !== color.number);
    } else {
      updated = [...selectedColors, color];
    }
    
    setSelectedColors(updated);

    // Auto-copy comma-separated HEX list to clipboard
    const hexList = updated.map((c) => c.hex).join(", ");
    if (updated.length > 0) {
      navigator.clipboard.writeText(hexList).then(() => {
        setShowCopiedAlert(true);
        setTimeout(() => setShowCopiedAlert(false), 1500);
      }).catch((err) => {
        console.error("Auto-copy failed:", err);
      });
    }
  };

  // Single sidebar copy action
  const handleCopySingle = async (hex: string, id: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy color HEX:", err);
    }
  };

  // Upload and parse image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImageSrc(dataUrl);

      const img = new Image();
      img.onload = () => {
        extractColorsFromImage(img, allColors, (colors) => {
          setExtractedPantones(colors);
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const displayedColors = filteredColors.slice(0, visibleCount);
  const modalDisplayedColors = filteredColors.slice(0, modalVisibleCount);

  // Formatted comma-separated HEX list
  const clipboardString = useMemo(() => {
    return selectedColors.map((c) => c.hex).join(", ");
  }, [selectedColors]);

  return (
    <div className="flex h-full flex-col bg-background/95 border-l border-border backdrop-blur-xs">
      {/* Panel Header */}
      <div className="p-4 border-b border-border/80 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-foreground uppercase">
              Pantone Palette
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Fashion, Home + Interiors. Click to copy.
            </p>
          </div>

          {/* Maximize Trigger */}
          <Dialog open={isMaximized} onOpenChange={setIsMaximized}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-muted/80 shrink-0"
              >
                <Maximize2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-6 rounded-2xl gap-4 bg-background/98 border border-border/80">
              <DialogHeader className="shrink-0 flex flex-row items-center justify-between pr-8">
                <div>
                  <DialogTitle className="text-lg font-bold uppercase tracking-wider text-foreground">
                    Pantone Colors Swatch Book
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-1">
                    Select colors to bundle them into a comma-separated HEX string. Toggle grid layout or extract from image.
                  </DialogDescription>
                </div>
              </DialogHeader>

              {/* MODAL TABS NAVIGATION */}
              <div className="flex items-center border-b border-border/60 pb-2 gap-6 shrink-0">
                <button
                  onClick={() => setModalMode("search")}
                  className={`pb-1 text-sm font-semibold tracking-wide border-b-2 transition-all active:scale-98 ${
                    modalMode === "search"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Browse & Search
                </button>
                <button
                  onClick={() => setModalMode("image")}
                  className={`pb-1 text-sm font-semibold tracking-wide border-b-2 transition-all active:scale-98 ${
                    modalMode === "image"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Image Color Extractor
                </button>
              </div>

              {/* SEARCH + FEATURES ROW (DYNAMIC BASED ON TAB MODE) */}
              {modalMode === "search" ? (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-muted/20 border border-border/60 rounded-xl shrink-0">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80 pointer-events-none" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search name, code, or hex..."
                      className="pl-9 pr-28 h-9 text-xs bg-background border-border/60 focus:ring-0 focus:ring-offset-0 focus:border-border transition-all rounded-full"
                    />
                    {/* INSTANT COLOR PREVIEW PILL WITHIN SEARCH BAR */}
                    {searchQuery.trim() && filteredColors.length > 0 && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-background border border-border/80 py-0.5 px-2.5 rounded-full shadow-2xs text-[9px] pointer-events-none select-none">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: filteredColors[0].hex }}
                        />
                        <span className="text-muted-foreground font-semibold truncate max-w-[65px]">
                          {filteredColors[0].formattedName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Grid Columns Configuration */}
                  <div className="flex items-center gap-1.5 self-end md:self-auto">
                    <span className="text-[11px] text-muted-foreground font-medium mr-1">
                      Colors per row:
                    </span>
                    {[2, 3, 4, 6, 8, 10, 12].map((num) => (
                      <button
                        key={num}
                        onClick={() => setColsPerRow(num)}
                        className={`h-7 w-9 text-center text-xs font-semibold rounded-md transition-all active:scale-95 ${
                          colsPerRow === num
                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                            : "bg-background hover:bg-muted text-muted-foreground border border-border/60"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* IMAGE EXTRACTOR CONTROL BAR */
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 p-4 bg-muted/20 border border-border/60 rounded-xl shrink-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* File Upload Button */}
                    <div className="relative shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <Button variant="outline" size="sm" className="h-9 gap-2 rounded-full cursor-pointer">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span>Upload Image</span>
                      </Button>
                    </div>

                    {/* Image Preview Thumbnail */}
                    {imageSrc && (
                      <div className="flex items-center gap-2 bg-background border border-border/40 p-1.5 rounded-lg">
                        <img
                          src={imageSrc}
                          alt="Thumbnail"
                          className="h-8 w-12 object-cover rounded-md border border-black/10"
                        />
                        <span className="text-[10px] text-muted-foreground font-mono">Loaded</span>
                      </div>
                    )}
                  </div>

                  {/* Extractor parameters (Only visible if colors extracted) */}
                  {extractedPantones.length > 0 && (
                    <div className="flex flex-wrap items-center gap-4 mt-2 xl:mt-0">
                      {/* Num Colors Configuration */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          Count ({numColorsToExtract}):
                        </span>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={numColorsToExtract}
                          onChange={(e) => setNumColorsToExtract(Number(e.target.value))}
                          className="w-24 sm:w-32 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      {/* Sort/Filter Strategy Selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                          <SlidersHorizontal className="h-3 w-3" />
                          Filter:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { value: "popular", label: "Most Used" },
                            { value: "rare", label: "Least Used" },
                            { value: "lightest", label: "Lightest (Highlights)" },
                            { value: "darkest", label: "Darkest (Shadows)" },
                            { value: "saturated", label: "Most Saturated" },
                            { value: "desaturated", label: "Least Saturated" },
                          ].map((strategy) => (
                            <button
                              key={strategy.value}
                              onClick={() => setExtractionFilter(strategy.value as any)}
                              className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all active:scale-95 ${
                                extractionFilter === strategy.value
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-background text-muted-foreground border border-border/40 hover:bg-muted"
                              }`}
                            >
                              {strategy.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 1 ROW SPACE FOR SELECTIONS (SHARED BY BOTH MODAL VIEWS) */}
              <div className="shrink-0">
                {selectedColors.length > 0 ? (
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-3 bg-muted/30 border border-dashed border-border/80 rounded-xl">
                    <div className="flex-1 flex flex-wrap gap-1.5 items-center max-h-[80px] overflow-y-auto pr-2">
                      {selectedColors.map((c) => (
                        <div
                          key={c.number}
                          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-background border-border/80 shadow-2xs"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="text-foreground/80 truncate max-w-[100px]">
                            {c.formattedName}
                          </span>
                          <button
                            onClick={() => toggleSelectColor(c)}
                            className="ml-1 text-muted-foreground hover:text-red-500 font-bold text-[12px] leading-none shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                      {showCopiedAlert && (
                        <span className="text-[10px] text-green-500 font-semibold flex items-center gap-1 animate-pulse">
                          <Check className="h-3.5 w-3.5" />
                          <span>Copied to Clipboard!</span>
                        </span>
                      )}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(clipboardString);
                          setShowCopiedAlert(true);
                          setTimeout(() => setShowCopiedAlert(false), 1500);
                        }}
                        className="px-3.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg text-xs font-semibold shadow-xs active:scale-98 transition-all"
                      >
                        Copy HEX List
                      </button>
                      <button
                        onClick={() => setSelectedColors([])}
                        className="px-3 py-1.5 bg-background text-muted-foreground border border-border/60 hover:bg-muted hover:text-foreground rounded-lg text-xs font-semibold transition-all active:scale-98"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 bg-muted/5 border border-dashed border-border/30 rounded-xl text-xs text-muted-foreground select-none">
                    No selections yet. Click color boxes below to add to selection (copies list automatically).
                  </div>
                )}
              </div>

              {/* DYNAMIC SCROLL VIEW BASED ON MODE */}
              <div className="flex-1 min-h-0">
                {modalMode === "search" ? (
                  /* BROWSE & SEARCH GRID */
                  <ScrollArea
                    className="h-full pr-2"
                    onScrollCapture={handleModalScroll}
                  >
                    {modalDisplayedColors.length === 0 ? (
                      <div className="text-center py-16 text-xs text-muted-foreground">
                        No matching Pantone colors found.
                      </div>
                    ) : (
                      <div className={`grid ${gridColsClassMap[colsPerRow] || "grid-cols-6"} gap-3 pb-6`}>
                        {modalDisplayedColors.map((color) => {
                          const isSelected = selectedColors.some((c) => c.number === color.number);
                          const contrastClass = getContrastClass(color.hex);
                          return (
                            <button
                              key={color.number}
                              onClick={() => toggleSelectColor(color)}
                              className={`flex flex-col items-center p-2.5 rounded-xl border bg-background text-center relative overflow-hidden outline-none ${
                                isSelected
                                  ? "border-2 border-primary ring-1 ring-primary/20"
                                  : "border-border/60"
                              }`}
                            >
                              {/* Color Pill Swatch */}
                              <div
                                className="flex items-center justify-center w-full h-[64px] rounded-full text-[10px] font-mono tracking-wider shadow-2xs select-none shrink-0"
                                style={{ backgroundColor: color.hex }}
                              >
                                <span className={contrastClass}>
                                  {color.hex.toUpperCase()}
                                </span>
                              </div>

                              {/* Details */}
                              <div className="w-full flex flex-col items-center mt-2 px-1">
                                <span className="text-[11px] font-semibold text-foreground/90 w-full truncate text-center">
                                  {color.formattedName}
                                </span>
                                <span className="text-[9px] text-muted-foreground font-mono mt-0.5 uppercase tracking-wide">
                                  {color.number}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                ) : (
                  /* IMAGE EXTRACTOR OUTPUT GRID */
                  <ScrollArea className="h-full pr-2">
                    {extractedPantones.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center gap-2 select-none">
                        <Upload className="h-10 w-10 text-muted-foreground/60 stroke-[1.5]" />
                        <h4 className="text-sm font-semibold text-foreground">Extract Swatches from Image</h4>
                        <p className="text-xs text-muted-foreground max-w-sm mt-0.5">
                          Upload a picture to automatically identify and extract the closest Pantone colors.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 pb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                            Extracted Pantone Colors ({processedExtractedColors.length})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                          {processedExtractedColors.map((color) => {
                            const isSelected = selectedColors.some((c) => c.number === color.number);
                            const contrastClass = getContrastClass(color.hex);
                            return (
                              <button
                                key={color.number}
                                onClick={() => toggleSelectColor(color)}
                                className={`flex flex-col items-center p-2.5 rounded-xl border bg-background text-center relative overflow-hidden outline-none ${
                                  isSelected
                                    ? "border-2 border-primary ring-1 ring-primary/20"
                                    : "border-border/60"
                                }`}
                              >
                                {/* Color Pill Swatch */}
                                <div
                                  className="flex items-center justify-center w-full h-[64px] rounded-full text-[10px] font-mono tracking-wider shadow-2xs select-none shrink-0"
                                  style={{ backgroundColor: color.hex }}
                                >
                                  <span className={contrastClass}>
                                    {color.hex.toUpperCase()}
                                  </span>
                                </div>

                                {/* Details */}
                                <div className="w-full flex flex-col items-center mt-2 px-1">
                                  <span className="text-[11px] font-semibold text-foreground/90 w-full truncate text-center">
                                    {color.formattedName}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground font-mono mt-0.5 uppercase tracking-wide">
                                    {color.number}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, code, or hex..."
            className="pl-9 pr-28 h-9 text-xs bg-muted/20 border-border/60 focus:bg-background transition-all duration-300 rounded-full"
          />
          {/* INSTANT COLOR PREVIEW PILL WITHIN SEARCH BAR (SIDEBAR) */}
          {searchQuery.trim() && filteredColors.length > 0 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-background border border-border/60 py-0.5 px-2 rounded-full shadow-2xs text-[9px] pointer-events-none select-none">
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/10"
                style={{ backgroundColor: filteredColors[0].hex }}
              />
              <span className="text-muted-foreground truncate max-w-[50px]">
                {filteredColors[0].formattedName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Color Swatches (Sidebar View) */}
      <div className="flex-1 min-h-0">
        <ScrollArea 
          className="h-full px-3 py-2" 
          onScrollCapture={handleScroll}
        >
          {displayedColors.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              No matching Pantone colors found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pb-4">
              {displayedColors.map((color) => {
                const isCopied = copiedId === color.number;
                const contrastClass = getContrastClass(color.hex);
                return (
                  <button
                    key={color.number}
                    onClick={() => handleCopySingle(color.hex, color.number)}
                    className="flex flex-col items-center p-2 rounded-xl border border-border/40 hover:border-border hover:bg-muted/30 transition-all duration-300 group hover:shadow-xs text-center relative overflow-hidden"
                    style={{
                      // Custom hover properties using color hex as CSS variable for luxurious drop-shadow
                      ["--hover-shadow" as any]: `${color.hex}22`,
                    }}
                  >
                    {/* Color Pill Swatch (Row 1) - height 2x (h-16/64px), width 1.5x (w-[114px]) */}
                    <div
                      className="flex items-center justify-center w-[114px] h-[64px] rounded-full text-[10px] font-mono tracking-wider shadow-xs select-none transition-all duration-300 group-hover:scale-102 shrink-0"
                      style={{ backgroundColor: color.hex }}
                    >
                      <span className={contrastClass}>
                        {color.hex.toUpperCase()}
                      </span>
                    </div>

                    {/* Name & Details (Row 2) */}
                    <div className="w-full flex flex-col items-center mt-2 px-1">
                      <span className="text-[11px] font-medium text-foreground/90 w-full truncate text-center group-hover:text-primary transition-colors duration-200">
                        {color.formattedName}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono mt-0.5 uppercase tracking-wide">
                        {color.number}
                      </span>
                    </div>

                    {/* Copied overlay indicator */}
                    {isCopied && (
                      <div className="absolute inset-0 bg-background/90 backdrop-blur-xs flex flex-col items-center justify-center gap-1 text-[10px] text-green-500 font-medium transition-all duration-200">
                        <Check className="h-4 w-4" />
                        <span>Copied</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
