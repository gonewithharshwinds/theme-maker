"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Sparkle, Trash2, Plus, Copy, AlertCircle, FileJson, Folder } from "lucide-react";
import { ChatInterface } from "@/components/editor/ai/chat-interface";
import { AutocompleteColorInput } from "@/components/editor/autocomplete-color-input";
import ThemePresetSelect from "@/components/editor/theme-preset-select";
import TabsTriggerPill from "@/components/editor/theme-preview/tabs-trigger-pill";
import { HorizontalScrollArea } from "@/components/horizontal-scroll-area";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEditorStore, TokenDefinition } from "@/store/editor-store";
import { useAIThemeGenerationCore } from "@/hooks/use-ai-theme-generation-core";
import { toast } from "@/components/ui/use-toast";
import { ProjectManagerView } from "./project-manager-view";

interface ThemeControlPanelProps {
  styles: any;
  currentMode: "light" | "dark";
  onChange: (styles: any) => void;
}

const ThemeControlPanel = ({ styles, currentMode, onChange }: ThemeControlPanelProps) => {
  const { isGeneratingTheme } = useAIThemeGenerationCore();
  const [activeTab, setActiveTab] = useState<"tokens" | "ai">("tokens");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectManagerOpen, setProjectManagerOpen] = useState(false);

  // Connect to the extended Zustand store
  const tokens = useEditorStore((state) => state.tokens);
  const selectedGroupName = useEditorStore((state) => state.selectedGroupName);
  const setSelectedGroupName = useEditorStore((state) => state.setSelectedGroupName);
  const updateTokenValue = useEditorStore((state) => state.updateTokenValue);
  const duplicateGroup = useEditorStore((state) => state.duplicateGroup);
  const deleteGroup = useEditorStore((state) => state.deleteGroup);
  const addNewTokenRow = useEditorStore((state) => state.addNewTokenRow);
  const deleteTokenRow = useEditorStore((state) => state.deleteTokenRow);

  // Projects store hooks
  const projects = useEditorStore((state) => state.projects);
  const activeProjectId = useEditorStore((state) => state.activeProjectId);
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId);
  }, [projects, activeProjectId]);

  // Ctrl+D keyboard shortcut for group duplication
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "d") {
        if (selectedGroupName) {
          e.preventDefault();
          duplicateGroup(selectedGroupName);
          toast({
            title: "Group Duplicated",
            description: `Successfully duplicated "${selectedGroupName}"!`,
          });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedGroupName, duplicateGroup]);

  // Unique groups present in tokens list
  const groups = useMemo(() => {
    return [...new Set(tokens.map((t) => t.group))];
  }, [tokens]);

  // Filtered tokens based on search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokens;
    const query = searchQuery.toLowerCase();
    return tokens.filter(
      (t) =>
        t.key.toLowerCase().includes(query) ||
        t.label.toLowerCase().includes(query) ||
        t.group.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery]);

  // Filtered groups based on search results
  const activeGroups = useMemo(() => {
    return [...new Set(filteredTokens.map((t) => t.group))];
  }, [filteredTokens]);

  const handleDuplicateSelected = () => {
    if (selectedGroupName) {
      duplicateGroup(selectedGroupName);
      toast({
        title: "Group Duplicated",
        description: `Successfully duplicated "${selectedGroupName}"!`,
      });
    }
  };

  const handleDeleteSelected = () => {
    if (selectedGroupName) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete the token group "${selectedGroupName}"?`
      );
      if (confirmDelete) {
        deleteGroup(selectedGroupName);
        toast({
          title: "Group Deleted",
          description: `Successfully deleted "${selectedGroupName}"`,
        });
      }
    }
  };

  const copyGroupAsJSON = (groupName: string) => {
    const groupTokens = tokens.filter((t) => t.group === groupName);
    const json = JSON.stringify(groupTokens, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      toast({
        title: "JSON Copied",
        description: `Copied "${groupName}" token configuration schema to clipboard.`,
      });
    });
  };

  const handleAddTokenRow = (groupName: string) => {
    const key = prompt("Enter new token key (e.g. primary-active):");
    if (!key) return;
    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, "-");
    
    if (tokens.some(t => t.key === cleanKey)) {
      alert("A token with this key already exists!");
      return;
    }

    const label = cleanKey.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    const typePrompt = prompt("Enter type: 'color' or 'dimension' or 'font'", "color");
    const type = (typePrompt === "dimension" || typePrompt === "font") ? typePrompt : "color";

    const lightValue = prompt("Enter Light Mode value:", type === "color" ? "#000000" : "1rem");
    const darkValue = prompt("Enter Dark Mode value:", lightValue || (type === "color" ? "#000000" : "1rem"));

    if (lightValue === null || darkValue === null) return;

    const newToken: TokenDefinition = {
      key: cleanKey,
      label,
      type,
      group: groupName,
      value: {
        light: lightValue,
        dark: darkValue
      },
      ...(type === "dimension" ? {
        min: 0,
        max: 5,
        step: 0.05,
        unit: "rem"
      } : {})
    };

    addNewTokenRow(newToken);
    toast({
      title: "Token Added",
      description: `Added "--${cleanKey}" to group "${groupName}".`,
    });
  };

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="border-b">
        <ThemePresetSelect className="h-14 rounded-none" disabled={isGeneratingTheme} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col space-y-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="flex min-h-0 w-full flex-1 flex-col"
        >
          <HorizontalScrollArea className="mt-2 mb-1 px-4">
            <TabsList className="bg-background text-muted-foreground inline-flex w-fit items-center justify-center rounded-full px-0">
              <TabsTriggerPill value="tokens">Design Tokens Matrix</TabsTriggerPill>
              <TabsTriggerPill
                value="ai"
                className="data-[state=active]:[--effect:var(--secondary-foreground)] data-[state=active]:[--foreground:var(--muted-foreground)] data-[state=active]:[--muted-foreground:var(--effect)]"
              >
                <Sparkle className="mr-1 size-3.5 text-current" />
                <span className="animate-text via-foreground from-muted-foreground to-muted-foreground flex items-center gap-1 bg-gradient-to-r from-50% via-60% to-100% bg-[200%_auto] bg-clip-text text-sm text-transparent">
                  AI Assistant
                </span>
              </TabsTriggerPill>
            </TabsList>
          </HorizontalScrollArea>

          {/* AI Tab Content */}
          <TabsContent value="ai" className="mt-1 size-full overflow-hidden">
            <ChatInterface />
          </TabsContent>

          {/* Tokens Matrix Tab Content */}
          <TabsContent value="tokens" className="mt-1 size-full overflow-hidden flex flex-col flex-1">
            {/* Header control buttons & search */}
            <div className="px-4 pb-3 border-b border-border/50 flex flex-col gap-3">
              {/* Project workspace selection bar */}
              <div className="flex items-center justify-between border-b pb-2 border-dashed border-border/60">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Folder className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Workspace:
                  </span>
                  <span className="text-xs font-bold text-foreground truncate max-w-[150px]">
                    {activeProject?.name || "SaaS Template"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] px-2.5 rounded-full"
                  onClick={() => setProjectManagerOpen(true)}
                >
                  Manage Projects
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search token variables..."
                  className="w-full h-9 rounded-md border border-input px-3 text-sm focus:ring-1 focus:ring-primary bg-background"
                />
              </div>

              {/* Duplicate & Delete action bubble */}
              <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border border-border/40 text-xs">
                <span className="text-muted-foreground">
                  {selectedGroupName ? (
                    <span className="font-semibold text-foreground">
                      Selected: &ldquo;{selectedGroupName}&rdquo;
                    </span>
                  ) : (
                    "Select a table card below to edit/duplicate"
                  )}
                </span>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] py-0 px-2.5"
                    onClick={handleDuplicateSelected}
                    disabled={!selectedGroupName}
                  >
                    <Copy className="size-3 mr-1" />
                    Duplicate (Ctrl+D)
                  </Button>
                  {selectedGroupName && selectedGroupName.endsWith("Copy") && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-[11px] py-0 px-2.5"
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="size-3 mr-1" />
                      Delete Group
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 px-4 py-2">
              <div className="space-y-6 pb-12">
                {activeGroups.length === 0 ? (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    No matching token keys found.
                  </div>
                ) : (
                  activeGroups.map((groupName) => {
                    const groupTokens = filteredTokens.filter((t) => t.group === groupName);
                    const isSelected = selectedGroupName === groupName;

                    return (
                      <div
                        key={groupName}
                        onClick={(e) => {
                          const tag = (e.target as HTMLElement).tagName;
                          if (tag !== "INPUT" && tag !== "SELECT" && !((e.target as HTMLElement).closest("button"))) {
                            setSelectedGroupName(groupName);
                          }
                        }}
                        className={`rounded-xl border transition-all ${
                          isSelected
                            ? "border-2 border-blue-500 shadow-md ring-1 ring-blue-500/20"
                            : "border-border/80 hover:border-border-hover"
                        } overflow-hidden bg-card`}
                      >
                        {/* Group Card Header */}
                        <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Active Group
                              </span>
                            )}
                            <span className="font-bold text-sm tracking-wide text-foreground">
                              {groupName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Copy Schema JSON"
                              onClick={() => copyGroupAsJSON(groupName)}
                            >
                              <FileJson className="size-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              title="Add Row to Group"
                              onClick={() => handleAddTokenRow(groupName)}
                            >
                              <Plus className="size-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Tokens Grid Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border bg-muted/10 text-muted-foreground font-medium">
                                <th className="px-3 py-2 w-1/3">Variable Name</th>
                                <th className="px-3 py-2 w-1/3">Light Mode</th>
                                <th className="px-3 py-2 w-1/3">Dark Mode</th>
                                <th className="px-2 py-2 text-center w-10"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupTokens.map((token) => (
                                <tr
                                  key={token.key}
                                  className="border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors"
                                >
                                  {/* Variable label & key */}
                                  <td className="px-3 py-2.5 font-mono">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-foreground text-[11px] truncate max-w-[130px]" title={token.label}>
                                        {token.label}
                                      </span>
                                      <span className="text-[9px] text-muted-foreground">
                                        --{token.key}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Light mode input */}
                                  <td className="px-3 py-1.5">
                                    {token.type === "color" ? (
                                      <AutocompleteColorInput
                                        value={token.value.light}
                                        onChange={(val) =>
                                          updateTokenValue(token.key, "light", val)
                                        }
                                      />
                                    ) : (
                                      <Input
                                        className="h-8 text-xs font-mono"
                                        value={token.value.light}
                                        onChange={(e) =>
                                          updateTokenValue(token.key, "light", e.target.value)
                                        }
                                      />
                                    )}
                                  </td>

                                  {/* Dark mode input */}
                                  <td className="px-3 py-1.5">
                                    {token.type === "color" ? (
                                      <AutocompleteColorInput
                                        value={token.value.dark}
                                        onChange={(val) =>
                                          updateTokenValue(token.key, "dark", val)
                                        }
                                      />
                                    ) : (
                                      <Input
                                        className="h-8 text-xs font-mono"
                                        value={token.value.dark}
                                        onChange={(e) =>
                                          updateTokenValue(token.key, "dark", e.target.value)
                                        }
                                      />
                                    )}
                                  </td>

                                  {/* Row Actions */}
                                  <td className="px-2 py-2 text-center">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => {
                                        if (confirm(`Delete token Variable "--${token.key}"?`)) {
                                          deleteTokenRow(token.key);
                                        }
                                      }}
                                      className="h-6 w-6 text-muted-foreground hover:text-red-500"
                                      title="Delete Row"
                                    >
                                      <Trash2 className="size-3" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    <ProjectManagerView open={projectManagerOpen} onOpenChange={setProjectManagerOpen} />
  </>
  );
};

export default ThemeControlPanel;
