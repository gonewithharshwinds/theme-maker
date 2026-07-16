"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/revola";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditorStore } from "@/store/editor-store";
import { generateFigmaTokensCode } from "@/utils/theme-style-generator";
import { Check, Copy, Download } from "lucide-react";

interface FigmaExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FigmaExportDialog({ open, onOpenChange }: FigmaExportDialogProps) {
  const { themeState } = useEditorStore();
  const [copied, setCopied] = useState(false);

  // Generate tokens based on current editor state
  const tokensJson = React.useMemo(() => {
    return generateFigmaTokensCode(themeState);
  }, [themeState]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tokensJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy figma tokens:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([tokensJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${themeState.preset || "custom"}-figma-tokens.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="flex max-h-[90dvh] flex-col overflow-hidden sm:max-h-[min(700px,85dvh)] sm:max-w-xl bg-background border border-border/80 rounded-2xl shadow-xl">
        <ResponsiveDialogHeader className="px-6 pt-6 shrink-0 text-left">
          <ResponsiveDialogTitle className="text-xl font-bold font-brand tracking-wide text-foreground uppercase">
            Export Figma Design Tokens
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-xs text-muted-foreground mt-1">
            Copy or download your HSL-to-HEX translated design tokens to import directly into Figma.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {/* Inner Content Area */}
        <div className="flex-1 flex flex-col min-h-0 px-6 py-4 gap-4">
          {/* Instructions Box */}
          <div className="p-3 bg-muted/20 border border-border/40 rounded-xl text-xs text-muted-foreground/90 space-y-1">
            <span className="font-semibold text-foreground">How to import in Figma for Free:</span>
            <ol className="list-decimal pl-4 space-y-1 mt-1 text-[11px]">
              <li>Copy the tokens using the button below (or download the JSON file).</li>
              <li>Open your Figma workspace.</li>
              <li>Launch any free token manager plugin (e.g., <strong>Tokens Studio for Figma</strong> or <strong>Variables Import/Export</strong>).</li>
              <li>Paste or load the JSON file to automatically construct your variables.</li>
            </ol>
          </div>

          {/* Tokens Code Panel */}
          <div className="flex-1 flex flex-col min-h-0 border border-border/60 rounded-xl overflow-hidden bg-muted/10 relative">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-muted/20 shrink-0 text-[10px] text-muted-foreground font-mono">
              <span>figma-tokens.json</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 hover:text-foreground transition-colors p-1 rounded-sm"
                  title="Copy JSON code"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="text-green-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4 font-mono text-[11px] text-foreground/90 whitespace-pre leading-relaxed select-all bg-background/50">
              {tokensJson}
            </ScrollArea>
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 shrink-0 pt-2 border-t border-border/20">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2 h-9 rounded-lg"
            >
              <Download className="h-4 w-4" />
              <span>Download JSON</span>
            </Button>
            <Button
              size="sm"
              onClick={handleCopy}
              className="gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied" : "Copy to Clipboard"}</span>
            </Button>
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
