"use client";

import React, { useState, useMemo } from "react";
import { Plus, Trash2, Settings, Eye, Layout, Type, Image as ImageIcon, Circle as CircleIcon, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEditorStore, CustomElement, LayoutLayer, TokenDefinition } from "@/store/editor-store";
import { cn } from "@/lib/utils";
import pantoneDataRaw from "../../pantone-colors-master/pantone-numbers.json";

const pantoneData = pantoneDataRaw as Record<string, { name: string; hex: string }>;

// Helper to convert Pantone names/codes to Hex codes
const resolveToHex = (val: string): string => {
  if (!val) return "";
  const trimmed = val.trim();
  if (trimmed.startsWith("#")) return trimmed;
  if (trimmed.startsWith("rgb") || trimmed.startsWith("hsl") || trimmed.startsWith("oklch")) return trimmed;
  
  const clean = trimmed.toLowerCase().replace(/\s+/g, "-");
  if (pantoneData[trimmed]) return `#${pantoneData[trimmed].hex}`;
  if (pantoneData[clean]) return `#${pantoneData[clean].hex}`;
  if (pantoneData[`pantone-${clean}`]) return `#${pantoneData[`pantone-${clean}`].hex}`;
  
  return trimmed;
};

export function ElementBuilderSandbox() {
  const tokens = useEditorStore((state) => state.tokens);
  const currentMode = useEditorStore((state) => state.themeState.currentMode);
  const customElements = useEditorStore((state) => state.customElements);
  const addCustomElement = useEditorStore((state) => state.addCustomElement);
  const updateCustomElement = useEditorStore((state) => state.updateCustomElement);
  const deleteCustomElement = useEditorStore((state) => state.deleteCustomElement);

  // Layers layout actions
  const addLayoutLayer = useEditorStore((state) => state.addLayoutLayer);
  const updateLayoutLayer = useEditorStore((state) => state.updateLayoutLayer);
  const deleteLayoutLayer = useEditorStore((state) => state.deleteLayoutLayer);
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const setSelectedLayerId = useEditorStore((state) => state.setSelectedLayerId);

  const [activeElementId, setActiveElementId] = useState<string>(customElements[0]?.id || "");
  const [newLayerName, setNewLayerName] = useState("");
  const [newLayerType, setNewLayerType] = useState<"frame" | "rectangle" | "circle" | "text" | "image">("frame");
  const [newLayerParent, setNewLayerParent] = useState("");

  // Retrieve active element details
  const activeElement = useMemo(() => {
    return customElements.find((el) => el.id === activeElementId) || customElements[0];
  }, [customElements, activeElementId]);

  // Selected layer details
  const selectedLayer = useMemo(() => {
    if (!activeElement || !selectedLayerId) return null;
    return activeElement.layers.find((l) => l.id === selectedLayerId) || null;
  }, [activeElement, selectedLayerId]);

  // List of colors and dimensions to populate dropdown selectors
  const colorTokens = useMemo(() => {
    return tokens.filter((t) => t.type === "color");
  }, [tokens]);

  const dimensionTokens = useMemo(() => {
    return tokens.filter((t) => t.type === "dimension");
  }, [tokens]);

  const fontTokens = useMemo(() => {
    return tokens.filter((t) => t.type === "font");
  }, [tokens]);

  // Resolves bound values dynamically or falls back to raw properties
  const resolveStyle = (bindKey: string | undefined, fallbackVal: string) => {
    if (!bindKey) return resolveToHex(fallbackVal);
    const token = tokens.find((t) => t.key === bindKey);
    if (!token) return resolveToHex(fallbackVal);
    return resolveToHex(token.value[currentMode]);
  };

  const handleCreateNewElement = () => {
    const name = prompt("Enter a unique name for your new element (e.g. Header Nav):");
    if (!name) return;
    const cleanId = `el-${Date.now()}`;
    const rootLayerId = `layer-root-${Date.now()}`;
    
    const newEl: CustomElement = {
      id: cleanId,
      name: name.trim(),
      rootLayerId,
      layers: [
        {
          id: rootLayerId,
          name: "Root Wrapper",
          type: "frame",
          w: 300,
          h: 150,
          flexDirection: "column",
          gap: 12,
          padding: 16,
          rawBg: "#f3f4f6",
          rawText: "#1f2937",
          rawRadius: "8px"
        }
      ]
    };

    addCustomElement(newEl);
    setActiveElementId(cleanId);
    setSelectedLayerId(rootLayerId);
  };

  const handleDeleteElement = () => {
    if (!activeElementId) return;
    if (activeElementId === "el-button" || activeElementId === "el-card" || activeElementId === "el-badge") {
      alert("Default templates cannot be deleted!");
      return;
    }
    const confirmDelete = window.confirm(`Delete the element "${activeElement.name}"?`);
    if (confirmDelete) {
      deleteCustomElement(activeElementId);
      setActiveElementId(customElements[0]?.id || "");
    }
  };

  const handleAddLayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayerName.trim() || !activeElement) return;

    const layerId = `layer-${Date.now()}`;
    const newLayer: LayoutLayer = {
      id: layerId,
      name: newLayerName.trim(),
      type: newLayerType,
      parentId: newLayerParent || undefined,
      w: newLayerType === "text" || newLayerType === "image" ? "auto" : 100,
      h: newLayerType === "text" || newLayerType === "image" ? "auto" : 50,
      flexDirection: newLayerType === "frame" ? "row" : undefined,
      gap: newLayerType === "frame" ? 8 : undefined,
      padding: newLayerType === "frame" ? 8 : undefined,
      textContent: newLayerType === "text" ? "Sample Text" : undefined,
      rawBg: newLayerType === "frame" ? "transparent" : "#d1d5db",
      rawText: "#1f2937",
      rawRadius: "0px"
    };

    addLayoutLayer(activeElement.id, newLayer);
    setNewLayerName("");
    setNewLayerParent("");
  };

  const handleDeleteSelectedLayer = () => {
    if (!activeElement || !selectedLayerId) return;
    if (selectedLayerId === activeElement.rootLayerId) {
      alert("Cannot delete the root layout layer Wrapper!");
      return;
    }
    deleteLayoutLayer(activeElement.id, selectedLayerId);
  };

  // Pre-generate list of parents dropdown (only frames)
  const parentFramesList = useMemo(() => {
    if (!activeElement) return [];
    return activeElement.layers.filter((l) => l.type === "frame");
  }, [activeElement]);

  // Visual layout recursive layers renderer
  const renderLayerVisual = (layer: LayoutLayer) => {
    const children = activeElement.layers.filter((l) => l.parentId === layer.id);
    
    // Resolve token dynamic style attributes
    const bg = resolveStyle(layer.bgBind, layer.rawBg);
    const text = resolveStyle(layer.textBind, layer.rawText);
    const radius = resolveStyle(layer.radiusBind, layer.rawRadius);
    const font = resolveStyle(layer.fontBind, "");
    
    const isSelected = selectedLayerId === layer.id;
    
    // Style bindings
    const style: React.CSSProperties = {
      backgroundColor: bg,
      color: text,
      fontFamily: font || undefined,
      borderRadius: layer.type === "circle" ? "50%" : radius,
      width: layer.w === "auto" ? "auto" : layer.w === "full" ? "100%" : `${layer.w}px`,
      height: layer.h === "auto" ? "auto" : layer.h === "full" ? "100%" : `${layer.h}px`,
    };
    
    if (layer.type === "frame") {
      style.display = "flex";
      style.flexDirection = layer.flexDirection || "column";
      style.gap = `${layer.gap || 0}px`;
      style.padding = `${layer.padding || 0}px`;
      style.alignItems = "center";
      style.justifyContent = "center";
    }
    
    const handleLayerClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedLayerId(layer.id);
    };
    
    return (
      <div
        key={layer.id}
        onClick={handleLayerClick}
        className={cn(
          "transition-all cursor-pointer box-border relative flex items-center justify-center min-w-[20px] min-h-[20px]",
          isSelected ? "outline-2 outline-blue-500 outline ring-2 ring-blue-500/10" : "hover:outline-1 hover:outline-blue-400 hover:outline"
        )}
        style={style}
      >
        {/* Layer icon identifier for wireframe clarity */}
        {layer.type === "text" && (
          <span className="font-semibold text-center truncate max-w-full px-2">
            {layer.textContent || "Text layer"}
          </span>
        )}
        
        {layer.type === "image" && (
          <div className="w-full h-full flex items-center justify-center p-2 text-muted-foreground select-none">
            <ImageIcon className="size-4 opacity-50" />
          </div>
        )}

        {children.map(renderLayerVisual)}
      </div>
    );
  };

  // Render tree item recursively for left layers manager
  const renderLayerTreeItem = (layer: LayoutLayer, depth = 0) => {
    const children = activeElement.layers.filter((l) => l.parentId === layer.id);
    const isSelected = selectedLayerId === layer.id;

    return (
      <React.Fragment key={layer.id}>
        <div
          onClick={() => setSelectedLayerId(layer.id)}
          className={`flex items-center justify-between py-1.5 px-3 rounded-lg cursor-pointer transition-colors text-xs ${
            isSelected
              ? "bg-primary text-primary-foreground font-semibold"
              : "hover:bg-muted text-foreground"
          }`}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {layer.type === "frame" && <Layout className="size-3.5 opacity-70 shrink-0" />}
            {layer.type === "text" && <Type className="size-3.5 opacity-70 shrink-0" />}
            {layer.type === "image" && <ImageIcon className="size-3.5 opacity-70 shrink-0" />}
            {layer.type === "circle" && <CircleIcon className="size-3.5 opacity-70 shrink-0" />}
            {layer.type === "rectangle" && <Square className="size-3.5 opacity-70 shrink-0" />}
            <span className="truncate">{layer.name}</span>
          </div>
        </div>
        {children.map((child) => renderLayerTreeItem(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background/40">
      
      {/* Top Header selection bar */}
      <div className="p-3 border-b border-border bg-card shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground shrink-0 font-medium">Element:</Label>
          <select
            value={activeElementId}
            onChange={(e) => setActiveElementId(e.target.value)}
            className="h-8 rounded-md border border-input px-2 bg-background text-xs outline-none text-foreground font-semibold"
          >
            {customElements.map((el) => (
              <option key={el.id} value={el.id}>
                {el.name}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleCreateNewElement}>
            <Plus className="size-3.5 mr-1" /> Add New
          </Button>
          {activeElementId && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-red-500"
              onClick={handleDeleteElement}
              disabled={activeElementId === "el-button" || activeElementId === "el-card" || activeElementId === "el-badge"}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
        
        <span className="text-[10px] text-muted-foreground font-mono self-end sm:self-auto">
          Canvas Wireframer • Select layers on layout to inspect bindings
        </span>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-y md:divide-y-0 md:divide-x divide-border">
        
        {/* LEFT SIDEBAR: Layers tree manager & creator */}
        <div className="w-full md:w-[240px] shrink-0 bg-card p-4 flex flex-col gap-4 overflow-y-auto max-h-[300px] md:max-h-none">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Layers Tree
          </span>

          {/* Hierarchy list */}
          <div className="space-y-0.5 flex-1 min-h-[100px]">
            {activeElement && activeElement.layers.length > 0 ? (
              // Find the top root layer (has no parentId)
              activeElement.layers
                .filter((l) => !l.parentId)
                .map((rootL) => renderLayerTreeItem(rootL))
            ) : (
              <div className="text-center text-xs text-muted-foreground py-6">
                No layers defined.
              </div>
            )}
          </div>

          {/* Add Layer Section */}
          <form onSubmit={handleAddLayer} className="border-t pt-3 flex flex-col gap-2 shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              + Append Layer
            </span>
            <Input
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
              placeholder="Layer name (e.g. icon-box)..."
              className="h-8 text-xs"
              required
            />
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={newLayerType}
                onChange={(e) => setNewLayerType(e.target.value as any)}
                className="w-full h-8 rounded-md border border-input px-1 bg-background text-[11px] text-foreground outline-none"
              >
                <option value="frame">Frame</option>
                <option value="rectangle">Rectangle</option>
                <option value="circle">Circle</option>
                <option value="text">Text</option>
                <option value="image">Image</option>
              </select>
              <select
                value={newLayerParent}
                onChange={(e) => setNewLayerParent(e.target.value)}
                className="w-full h-8 rounded-md border border-input px-1 bg-background text-[11px] text-foreground outline-none"
              >
                <option value="">Root Wrapper</option>
                {parentFramesList.map((pf) => (
                  <option key={pf.id} value={pf.id}>
                    Inside: {pf.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm" className="h-8 text-xs w-full">
              Add Layer
            </Button>
          </form>
        </div>

        {/* MIDDLE AREA: Checkered Canvas */}
        <div 
          className="flex-1 flex items-center justify-center p-8 relative min-h-[300px] overflow-auto select-none"
          style={{
            backgroundImage: "radial-gradient(var(--border) 1px, transparent 0)",
            backgroundSize: "20px 20px"
          }}
          onClick={() => setSelectedLayerId(null)}
        >
          {activeElement && activeElement.layers.length > 0 ? (
            activeElement.layers
              .filter((l) => !l.parentId)
              .map((rootL) => renderLayerVisual(rootL))
          ) : (
            <div className="text-center text-xs text-muted-foreground">
              Element has no layers. Create a root Wrapper.
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: Layer Inspector */}
        <div className="w-full md:w-[280px] shrink-0 bg-card p-4 flex flex-col gap-4 overflow-y-auto max-h-[300px] md:max-h-none">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-semibold text-xs flex items-center gap-1 text-foreground">
              <Settings className="size-3.5 text-primary" />
              Layer Inspector
            </span>
            {selectedLayer && selectedLayer.id !== activeElement?.rootLayerId && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-muted-foreground hover:text-red-500"
                onClick={handleDeleteSelectedLayer}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>

          {selectedLayer ? (
            <div className="space-y-4">
              {/* Properties: Width & Height */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Width</Label>
                  <select
                    value={selectedLayer.w === "auto" || selectedLayer.w === "full" ? selectedLayer.w : "custom"}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "auto" || v === "full") {
                        updateLayoutLayer(activeElement.id, selectedLayer.id, { w: v });
                      } else {
                        updateLayoutLayer(activeElement.id, selectedLayer.id, { w: 100 });
                      }
                    }}
                    className="w-full h-8 rounded-md border border-input px-2 bg-background text-xs text-foreground outline-none"
                  >
                    <option value="auto">Auto</option>
                    <option value="full">Full Width</option>
                    <option value="custom">Custom (px)</option>
                  </select>
                  {typeof selectedLayer.w === "number" && (
                    <Input
                      type="number"
                      value={selectedLayer.w}
                      onChange={(e) => updateLayoutLayer(activeElement.id, selectedLayer.id, { w: parseInt(e.target.value) || 20 })}
                      className="h-8 text-xs font-mono mt-1"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Height</Label>
                  <select
                    value={selectedLayer.h === "auto" || selectedLayer.h === "full" ? selectedLayer.h : "custom"}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "auto" || v === "full") {
                        updateLayoutLayer(activeElement.id, selectedLayer.id, { h: v });
                      } else {
                        updateLayoutLayer(activeElement.id, selectedLayer.id, { h: 50 });
                      }
                    }}
                    className="w-full h-8 rounded-md border border-input px-2 bg-background text-xs text-foreground outline-none"
                  >
                    <option value="auto">Auto</option>
                    <option value="full">Full Height</option>
                    <option value="custom">Custom (px)</option>
                  </select>
                  {typeof selectedLayer.h === "number" && (
                    <Input
                      type="number"
                      value={selectedLayer.h}
                      onChange={(e) => updateLayoutLayer(activeElement.id, selectedLayer.id, { h: parseInt(e.target.value) || 20 })}
                      className="h-8 text-xs font-mono mt-1"
                    />
                  )}
                </div>
              </div>

              {/* Text content details */}
              {selectedLayer.type === "text" && (
                <div className="space-y-1 border-t pt-3">
                  <Label className="text-xs text-muted-foreground">Text Label</Label>
                  <Input
                    value={selectedLayer.textContent || ""}
                    onChange={(e) => updateLayoutLayer(activeElement.id, selectedLayer.id, { textContent: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              )}

              {/* Frame layout constraints */}
              {selectedLayer.type === "frame" && (
                <div className="space-y-2 border-t pt-3">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Flex Layout
                  </span>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Direction</Label>
                    <select
                      value={selectedLayer.flexDirection || "row"}
                      onChange={(e) => updateLayoutLayer(activeElement.id, selectedLayer.id, { flexDirection: e.target.value as any })}
                      className="w-full h-8 rounded-md border border-input px-2 bg-background text-xs text-foreground outline-none"
                    >
                      <option value="row">Flex Row (Horizontal)</option>
                      <option value="column">Flex Column (Vertical)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Padding (px)</Label>
                      <Input
                        type="number"
                        value={selectedLayer.padding || 0}
                        onChange={(e) => updateLayoutLayer(activeElement.id, selectedLayer.id, { padding: parseInt(e.target.value) || 0 })}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Gap (px)</Label>
                      <Input
                        type="number"
                        value={selectedLayer.gap || 0}
                        onChange={(e) => updateLayoutLayer(activeElement.id, selectedLayer.id, { gap: parseInt(e.target.value) || 0 })}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Design Token Bindings */}
              <div className="space-y-2.5 border-t pt-3">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Design Token Bindings
                </span>

                {/* Bg Bind */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Background Fill Bind</Label>
                  <select
                    value={selectedLayer.bgBind || ""}
                    onChange={(e) => updateLayoutLayer(activeElement.id, selectedLayer.id, { bgBind: e.target.value || undefined })}
                    className="w-full h-8 rounded-md border border-input px-2 bg-background text-xs text-foreground outline-none"
                  >
                    <option value="">-- No bind (use raw state) --</option>
                    {colorTokens.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label} (--{t.key})
                      </option>
                    ))}
                  </select>
                  {!selectedLayer.bgBind && (
                    <Input
                      placeholder="Raw Background Color"
                      value={selectedLayer.rawBg}
                      onChange={(e) => updateLayoutLayer(activeElement.id, selectedLayer.id, { rawBg: e.target.value })}
                      className="h-8 text-xs font-mono mt-1"
                    />
                  )}
                </div>

                {/* Text Bind */}
                {selectedLayer.type === "text" && (
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Text Color Bind</Label>
                    <select
                      value={selectedLayer.textBind || ""}
                      onChange={(e) => updateLayoutLayer(activeElement.id, selectedLayer.id, { textBind: e.target.value || undefined })}
                      className="w-full h-8 rounded-md border border-input px-2 bg-background text-xs text-foreground outline-none"
                    >
                      <option value="">-- No bind (use raw state) --</option>
                      {colorTokens.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label} (--{t.key})
                        </option>
                      ))}
                    </select>
                    {!selectedLayer.textBind && (
                      <Input
                        placeholder="Raw Text Color"
                        value={selectedLayer.rawText}
                        onChange={(e) => updateLayoutLayer(activeElement.id, selectedLayer.id, { rawText: e.target.value })}
                        className="h-8 text-xs font-mono mt-1"
                      />
                    )}
                  </div>
                )}

                {/* Font Bind */}
                {selectedLayer.type === "text" && (
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Font Family Bind</Label>
                    <select
                      value={selectedLayer.fontBind || ""}
                      onChange={(e) => updateLayoutLayer(activeElement.id, selectedLayer.id, { fontBind: e.target.value || undefined })}
                      className="w-full h-8 rounded-md border border-input px-2 bg-background text-xs text-foreground outline-none"
                    >
                      <option value="">-- Default font --</option>
                      {fontTokens.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label} (--{t.key})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Radius Bind */}
                {selectedLayer.type !== "text" && selectedLayer.type !== "circle" && (
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Corner Radius Bind</Label>
                    <select
                      value={selectedLayer.radiusBind || ""}
                      onChange={(e) => updateLayoutLayer(activeElement.id, selectedLayer.id, { radiusBind: e.target.value || undefined })}
                      className="w-full h-8 rounded-md border border-input px-2 bg-background text-xs text-foreground outline-none"
                    >
                      <option value="">-- No bind (use raw state) --</option>
                      {dimensionTokens.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label} (--{t.key})
                        </option>
                      ))}
                    </select>
                    {!selectedLayer.radiusBind && (
                      <Input
                        placeholder="Raw Corner Radius"
                        value={selectedLayer.rawRadius}
                        onChange={(e) => updateLayoutLayer(activeElement.id, selectedLayer.id, { rawRadius: e.target.value })}
                        className="h-8 text-xs font-mono mt-1"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-muted-foreground">
              Select a layer on the canvas or tree to inspect its wireframe settings.
            </div>
          )}
        </div>

      </div>
      
    </div>
  );
}
