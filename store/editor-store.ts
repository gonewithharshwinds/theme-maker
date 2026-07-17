import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ThemeEditorState } from "@/types/editor";
import { defaultThemeState } from "@/config/theme";
import { getPresetThemeStyles } from "@/utils/theme-preset-helper";
import { isDeepEqual } from "@/lib/utils";
import { ThemeStyles, ThemeStyleProps } from "@/types/theme";

const MAX_HISTORY_COUNT = 30;
const HISTORY_OVERRIDE_THRESHOLD_MS = 500; // 0.5 seconds


export interface TokenDefinition {
  key: string;
  label: string;
  type: "color" | "dimension" | "font";
  group: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  value: {
    light: string;
    dark: string;
  };
}

export interface LayoutLayer {
  id: string;
  name: string;
  type: "frame" | "rectangle" | "circle" | "text" | "image";
  parentId?: string; // Nested inside dynamic parent frame
  w: number | "auto" | "full";
  h: number | "auto" | "full";
  flexDirection?: "row" | "column";
  gap?: number;
  padding?: number;
  textContent?: string;
  // Token bindings
  bgBind?: string;
  textBind?: string;
  radiusBind?: string;
  fontBind?: string;
  // Fallbacks
  rawBg: string;
  rawText: string;
  rawRadius: string;
}

export interface CustomElement {
  id: string;
  name: string;
  rootLayerId: string;
  layers: LayoutLayer[];
}

export interface Project {
  id: string;
  name: string;
  tokens: TokenDefinition[];
  customElements: CustomElement[];
}

const DEFAULT_SaaS_ELEMENTS: CustomElement[] = [
  {
    id: "el-button",
    name: "CTA Button",
    rootLayerId: "btn-frame",
    layers: [
      {
        id: "btn-frame",
        name: "Button Frame",
        type: "frame",
        w: 160,
        h: 46,
        flexDirection: "row",
        gap: 8,
        padding: 8,
        bgBind: "primary",
        radiusBind: "radius",
        rawBg: "#4f46e5",
        rawText: "#ffffff",
        rawRadius: "8px"
      },
      {
        id: "btn-text",
        name: "Label Text",
        type: "text",
        parentId: "btn-frame",
        w: "auto",
        h: "auto",
        textContent: "Submit Form",
        textBind: "primary-foreground",
        rawBg: "transparent",
        rawText: "#ffffff",
        rawRadius: "0px"
      }
    ]
  },
  {
    id: "el-card",
    name: "Info Card Surface",
    rootLayerId: "card-frame",
    layers: [
      {
        id: "card-frame",
        name: "Card Wrapper",
        type: "frame",
        w: 240,
        h: 120,
        flexDirection: "column",
        gap: 8,
        padding: 16,
        bgBind: "card",
        radiusBind: "radius",
        rawBg: "#1f2937",
        rawText: "#f9fafb",
        rawRadius: "12px"
      },
      {
        id: "card-title",
        name: "Card Title",
        type: "text",
        parentId: "card-frame",
        w: "auto",
        h: "auto",
        textContent: "Status Active",
        textBind: "card-foreground",
        rawBg: "transparent",
        rawText: "#ffffff",
        rawRadius: "0px"
      },
      {
        id: "card-desc",
        name: "Description Text",
        type: "text",
        parentId: "card-frame",
        w: "auto",
        h: "auto",
        textContent: "System performing normally",
        rawBg: "transparent",
        rawText: "#94a3b8",
        rawRadius: "0px"
      }
    ]
  },
  {
    id: "el-badge",
    name: "Pill Tag",
    rootLayerId: "badge-frame",
    layers: [
      {
        id: "badge-frame",
        name: "Pill Frame",
        type: "frame",
        w: 90,
        h: 28,
        flexDirection: "row",
        gap: 4,
        padding: 4,
        bgBind: "secondary",
        radiusBind: "radius",
        rawBg: "#e5e7eb",
        rawText: "#1f2937",
        rawRadius: "20px"
      },
      {
        id: "badge-text",
        name: "Badge Text",
        type: "text",
        parentId: "badge-frame",
        w: "auto",
        h: "auto",
        textContent: "Popular",
        textBind: "secondary-foreground",
        rawBg: "transparent",
        rawText: "#1f2937",
        rawRadius: "0px"
      }
    ]
  }
];

export function getTokensFromStyles(styles: ThemeStyles): TokenDefinition[] {
  const light = styles.light as Record<string, any>;
  const dark = styles.dark as Record<string, any>;
  
  const tokensList: TokenDefinition[] = [];
  
  Object.keys(light).forEach(key => {
    const lightVal = light[key];
    const darkVal = dark[key] || lightVal;
    
    let type: "color" | "dimension" | "font" = "color";
    let group = "Colors";
    
    if (key.startsWith("font-") || key === "font") {
      type = "font";
      group = "Typography";
    } else if (
      key === "radius" || key === "spacing" || key === "letter-spacing" ||
      key.endsWith("-radius") || key.endsWith("-spacing") || key.endsWith("-letter-spacing") ||
      key.includes("radius") || key.includes("spacing") || key.includes("tracking")
    ) {
      type = "dimension";
      group = "Borders & Layout";
    } else if (key.startsWith("sidebar")) {
      type = "color";
      group = "Sidebar Colors";
    } else if (key.startsWith("chart")) {
      type = "color";
      group = "Chart Colors";
    }
    
    tokensList.push({
      key,
      label: key
        .split("-")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      type,
      group,
      value: {
        light: String(lightVal),
        dark: String(darkVal)
      },
      ...(type === "dimension" ? {
        min: 0,
        max: key === "letter-spacing" ? 0.2 : 5,
        step: key === "letter-spacing" ? 0.01 : 0.05,
        unit: key === "radius" || key === "spacing" ? "rem" : "em"
      } : {})
    });
  });
  
  return tokensList;
}

function syncTokensToStyles(tokens: TokenDefinition[], currentStyles: ThemeStyles): ThemeStyles {
  const light = { ...currentStyles.light } as Record<string, any>;
  const dark = { ...currentStyles.dark } as Record<string, any>;
  
  tokens.forEach(t => {
    light[t.key] = t.value.light;
    dark[t.key] = t.value.dark;
  });
  
  return {
    light: light as any,
    dark: dark as any
  };
}

interface ThemeHistoryEntry {
  state: ThemeEditorState;
  timestamp: number;
}

interface EditorStore {
  themeState: ThemeEditorState;
  themeCheckpoint: ThemeEditorState | null;
  history: ThemeHistoryEntry[];
  future: ThemeHistoryEntry[];
  
  // Custom design token management additions
  tokens: TokenDefinition[];
  selectedGroupName: string | null;
  customElements: CustomElement[];
  
  // Projects states
  projects: Project[];
  activeProjectId: string;
  selectedLayerId: string | null;
  
  setThemeState: (state: ThemeEditorState) => void;
  applyThemePreset: (preset: string) => void;
  saveThemeCheckpoint: () => void;
  restoreThemeCheckpoint: () => void;
  resetToCurrentPreset: () => void;
  hasThemeChangedFromCheckpoint: () => boolean;
  hasUnsavedChanges: () => boolean;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Actions
  setSelectedGroupName: (name: string | null) => void;
  updateTokenValue: (key: string, mode: "light" | "dark", value: string) => void;
  duplicateGroup: (groupName: string) => void;
  deleteGroup: (groupName: string) => void;
  addNewTokenRow: (token: TokenDefinition) => void;
  deleteTokenRow: (key: string) => void;
  
  // Elements sandbox actions
  addCustomElement: (element: CustomElement) => void;
  updateCustomElement: (id: string, updates: Partial<CustomElement>) => void;
  deleteCustomElement: (id: string) => void;
  
  // Layout hierarchy actions
  addLayoutLayer: (elementId: string, layer: LayoutLayer) => void;
  updateLayoutLayer: (elementId: string, layerId: string, updates: Partial<LayoutLayer>) => void;
  deleteLayoutLayer: (elementId: string, layerId: string) => void;
  setSelectedLayerId: (layerId: string | null) => void;

  // Projects actions
  switchProject: (projectId: string) => void;
  createNewProject: (name: string) => void;
  deleteProject: (projectId: string) => void;
  resetDefaultProject: () => void;
}

const initialDefaultTokens = getTokensFromStyles(defaultThemeState.styles);

const initialDefaultProjects: Project[] = [
  {
    id: "proj-shadcn",
    name: "Shadcn SaaS (Template)",
    tokens: initialDefaultTokens,
    customElements: DEFAULT_SaaS_ELEMENTS
  }
];

export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      themeState: defaultThemeState,
      themeCheckpoint: null,
      history: [],
      future: [],
      
      // Initial state additions
      tokens: initialDefaultTokens,
      selectedGroupName: null,
      customElements: DEFAULT_SaaS_ELEMENTS,
      
      // Project states
      projects: initialDefaultProjects,
      activeProjectId: "proj-shadcn",
      selectedLayerId: null,
      
      setThemeState: (newState: ThemeEditorState) => {
        const oldThemeState = get().themeState;
        let currentHistory = get().history;
        let currentFuture = get().future;

        const oldStateWithoutMode = { ...oldThemeState, currentMode: undefined };
        const newStateWithoutMode = { ...newState, currentMode: undefined };

        if (
          isDeepEqual(oldStateWithoutMode, newStateWithoutMode) &&
          oldThemeState.currentMode !== newState.currentMode
        ) {
          set({ themeState: newState });
          return;
        }

        const currentTime = Date.now();
        const lastHistoryEntry =
          currentHistory.length > 0 ? currentHistory[currentHistory.length - 1] : null;

        if (
          !lastHistoryEntry ||
          currentTime - lastHistoryEntry.timestamp >= HISTORY_OVERRIDE_THRESHOLD_MS
        ) {
          currentHistory = [...currentHistory, { state: oldThemeState, timestamp: currentTime }];
          currentFuture = [];
        }

        if (currentHistory.length > MAX_HISTORY_COUNT) {
          currentHistory.shift();
        }

        let nextTokens = get().tokens;
        if (!isDeepEqual(oldThemeState.styles, newState.styles)) {
          nextTokens = getTokensFromStyles(newState.styles);
        }

        set({
          themeState: newState,
          tokens: nextTokens,
          history: currentHistory,
          future: currentFuture,
        });
      },
      applyThemePreset: (preset: string) => {
        const currentThemeState = get().themeState;
        const oldHistory = get().history;
        const currentTime = Date.now();

        const newStyles = getPresetThemeStyles(preset);
        const newThemeState: ThemeEditorState = {
          ...currentThemeState,
          preset,
          styles: newStyles,
          hslAdjustments: defaultThemeState.hslAdjustments,
        };

        const newHistoryEntry = { state: currentThemeState, timestamp: currentTime };
        let updatedHistory = [...oldHistory, newHistoryEntry];
        if (updatedHistory.length > MAX_HISTORY_COUNT) {
          updatedHistory.shift();
        }

        const newTokens = getTokensFromStyles(newStyles);

        set({
          themeState: newThemeState,
          themeCheckpoint: newThemeState,
          tokens: newTokens,
          history: updatedHistory,
          future: [],
        });
      },
      saveThemeCheckpoint: () => {
        set({ themeCheckpoint: get().themeState });
      },
      restoreThemeCheckpoint: () => {
        const checkpoint = get().themeCheckpoint;
        if (checkpoint) {
          const oldThemeState = get().themeState;
          const oldHistory = get().history;
          const currentTime = Date.now();

          const newHistoryEntry = { state: oldThemeState, timestamp: currentTime };
          let updatedHistory = [...oldHistory, newHistoryEntry];
          if (updatedHistory.length > MAX_HISTORY_COUNT) {
            updatedHistory.shift();
          }

          const restoredStyles = checkpoint.styles;
          const restoredTokens = getTokensFromStyles(restoredStyles);

          set({
            themeState: {
              ...checkpoint,
              currentMode: get().themeState.currentMode,
            },
            tokens: restoredTokens,
            history: updatedHistory,
            future: [],
          });
        } else {
          console.warn("No theme checkpoint available to restore to.");
        }
      },
      hasThemeChangedFromCheckpoint: () => {
        const checkpoint = get().themeCheckpoint;
        return !isDeepEqual(get().themeState, checkpoint);
      },
      hasUnsavedChanges: () => {
        const themeState = get().themeState;
        const presetThemeStyles = getPresetThemeStyles(themeState.preset ?? "default");
        const stylesChanged = !isDeepEqual(themeState.styles, presetThemeStyles);
        const hslChanged = !isDeepEqual(
          themeState.hslAdjustments,
          defaultThemeState.hslAdjustments
        );
        return stylesChanged || hslChanged;
      },
      resetToCurrentPreset: () => {
        const currentThemeState = get().themeState;

        const presetThemeStyles = getPresetThemeStyles(currentThemeState.preset ?? "default");
        const newThemeState: ThemeEditorState = {
          ...currentThemeState,
          styles: presetThemeStyles,
          hslAdjustments: defaultThemeState.hslAdjustments,
        };

        const resetTokens = getTokensFromStyles(presetThemeStyles);

        set({
          themeState: newThemeState,
          themeCheckpoint: newThemeState,
          tokens: resetTokens,
          history: [],
          future: [],
        });
      },
      undo: () => {
        const history = get().history;
        if (history.length === 0) {
          return;
        }

        const currentThemeState = get().themeState;
        const future = get().future;

        const lastHistoryEntry = history[history.length - 1];
        const newHistory = history.slice(0, -1);

        const newFutureEntry = { state: currentThemeState, timestamp: Date.now() };
        const newFuture = [newFutureEntry, ...future];

        const restoredStyles = lastHistoryEntry.state.styles;
        const restoredTokens = getTokensFromStyles(restoredStyles);

        set({
          themeState: {
            ...lastHistoryEntry.state,
            currentMode: currentThemeState.currentMode,
          },
          tokens: restoredTokens,
          themeCheckpoint: lastHistoryEntry.state,
          history: newHistory,
          future: newFuture,
        });
      },
      redo: () => {
        const future = get().future;
        if (future.length === 0) {
          return;
        }
        const history = get().history;

        const firstFutureEntry = future[0];
        const newFuture = future.slice(1);

        const currentThemeState = get().themeState;

        const newHistoryEntry = { state: currentThemeState, timestamp: Date.now() };
        let updatedHistory = [...history, newHistoryEntry];
        if (updatedHistory.length > MAX_HISTORY_COUNT) {
          updatedHistory.shift();
        }

        const restoredStyles = firstFutureEntry.state.styles;
        const restoredTokens = getTokensFromStyles(restoredStyles);

        set({
          themeState: {
            ...firstFutureEntry.state,
            currentMode: currentThemeState.currentMode,
          },
          tokens: restoredTokens,
          themeCheckpoint: firstFutureEntry.state,
          history: updatedHistory,
          future: newFuture,
        });
      },
      canUndo: () => get().history.length > 0,
      canRedo: () => get().future.length > 0,

      // Token and Group mutations
      setSelectedGroupName: (name) => set({ selectedGroupName: name }),
      
      updateTokenValue: (key, mode, value) => {
        const nextTokens = get().tokens.map(t => {
          if (t.key === key) {
            return {
              ...t,
              value: {
                ...t.value,
                [mode]: value
              }
            };
          }
          return t;
        });

        const nextStyles = syncTokensToStyles(nextTokens, get().themeState.styles);
        
        get().setThemeState({
          ...get().themeState,
          styles: nextStyles
        });
      },
      
      duplicateGroup: (groupName) => {
        const newGroupName = `${groupName} Copy`;
        const activeTokens = get().tokens;
        const groupTokens = activeTokens.filter(t => t.group === groupName);
        
        if (groupTokens.length === 0) return;
        
        const duplicated: TokenDefinition[] = [];
        groupTokens.forEach(t => {
          let newKey = `${t.key}-copy`;
          let counter = 1;
          while (activeTokens.some(tok => tok.key === newKey) || duplicated.some(tok => tok.key === newKey)) {
            newKey = `${t.key}-copy-${counter}`;
            counter++;
          }
          
          duplicated.push({
            ...t,
            key: newKey,
            label: `${t.label} Copy`,
            group: newGroupName,
            value: { ...t.value }
          });
        });
        
        const nextTokens = [...activeTokens, ...duplicated];
        const nextStyles = syncTokensToStyles(nextTokens, get().themeState.styles);
        
        set({ selectedGroupName: newGroupName });
        get().setThemeState({
          ...get().themeState,
          styles: nextStyles
        });
      },
      
      deleteGroup: (groupName) => {
        const nextTokens = get().tokens.filter(t => t.group !== groupName);
        const nextStyles = syncTokensToStyles(nextTokens, get().themeState.styles);
        
        set({ selectedGroupName: null });
        get().setThemeState({
          ...get().themeState,
          styles: nextStyles
        });
      },
      
      addNewTokenRow: (token) => {
        const nextTokens = [...get().tokens, token];
        const nextStyles = syncTokensToStyles(nextTokens, get().themeState.styles);
        
        get().setThemeState({
          ...get().themeState,
          styles: nextStyles
        });
      },
      
      deleteTokenRow: (key) => {
        const nextTokens = get().tokens.filter(t => t.key !== key);
        const nextStyles = syncTokensToStyles(nextTokens, get().themeState.styles);
        
        get().setThemeState({
          ...get().themeState,
          styles: nextStyles
        });
      },
      
      // Sandbox Elements management
      addCustomElement: (element) => {
        set({ customElements: [...get().customElements, element] });
      },
      
      updateCustomElement: (id, updates) => {
        const nextElements = get().customElements.map(el => {
          if (el.id === id) {
            return { ...el, ...updates } as CustomElement;
          }
          return el;
        });
        set({ customElements: nextElements });
      },

      deleteCustomElement: (id) => {
        const nextElements = get().customElements.filter(el => el.id !== id);
        set({ customElements: nextElements });
      },
      
      // Layout layers hierarchy modifications
      addLayoutLayer: (elementId, layer) => {
        const nextElements = get().customElements.map(el => {
          if (el.id === elementId) {
            return {
              ...el,
              layers: [...el.layers, layer]
            };
          }
          return el;
        });
        set({ customElements: nextElements, selectedLayerId: layer.id });
      },

      updateLayoutLayer: (elementId, layerId, updates) => {
        const nextElements = get().customElements.map(el => {
          if (el.id === elementId) {
            return {
              ...el,
              layers: el.layers.map(l => (l.id === layerId ? { ...l, ...updates } : l))
            };
          }
          return el;
        });
        set({ customElements: nextElements });
      },

      deleteLayoutLayer: (elementId, layerId) => {
        const nextElements = get().customElements.map(el => {
          if (el.id === elementId) {
            const keepLayers: typeof el.layers = [];
            const excludeIds = new Set([layerId]);
            
            let changed = true;
            while (changed) {
              changed = false;
              el.layers.forEach(l => {
                if (l.parentId && excludeIds.has(l.parentId) && !excludeIds.has(l.id)) {
                  excludeIds.add(l.id);
                  changed = true;
                }
              });
            }

            el.layers.forEach(l => {
              if (!excludeIds.has(l.id)) {
                keepLayers.push(l);
              }
            });

            let rootId = el.rootLayerId;
            if (excludeIds.has(rootId)) {
              rootId = keepLayers[0]?.id || "";
            }

            return {
              ...el,
              rootLayerId: rootId,
              layers: keepLayers
            };
          }
          return el;
        });
        set({ customElements: nextElements, selectedLayerId: null });
      },

      setSelectedLayerId: (layerId) => set({ selectedLayerId: layerId }),

      // Projects actions implementation
      switchProject: (projectId) => {
        const currentActiveId = get().activeProjectId;
        const currentProjects = get().projects;
        const rootTokens = get().tokens;
        const rootElements = get().customElements;

        const updatedProjects = currentProjects.map(p => {
          if (p.id === currentActiveId) {
            return {
              ...p,
              tokens: rootTokens,
              customElements: rootElements
            };
          }
          return p;
        });

        const targetProj = updatedProjects.find(p => p.id === projectId);
        if (!targetProj) return;

        const nextStyles = syncTokensToStyles(targetProj.tokens, get().themeState.styles);

        set({
          projects: updatedProjects,
          activeProjectId: projectId,
          tokens: targetProj.tokens,
          customElements: targetProj.customElements,
          selectedLayerId: null,
          selectedGroupName: null,
          themeState: {
            ...get().themeState,
            styles: nextStyles
          }
        });
      },

      createNewProject: (name) => {
        const currentActiveId = get().activeProjectId;
        const currentProjects = get().projects;
        const rootTokens = get().tokens;
        const rootElements = get().customElements;

        const updatedProjects = currentProjects.map(p => {
          if (p.id === currentActiveId) {
            return {
              ...p,
              tokens: rootTokens,
              customElements: rootElements
            };
          }
          return p;
        });

        const cleanStyles = {
          light: {
            background: "#ffffff",
            foreground: "#09090b",
            primary: "#18181b",
            "primary-foreground": "#fafafa",
            secondary: "#f4f4f5",
            "secondary-foreground": "#18181b",
            card: "#ffffff",
            "card-foreground": "#09090b",
            border: "#e4e4e7",
            radius: "0.5rem"
          },
          dark: {
            background: "#09090b",
            foreground: "#fafafa",
            primary: "#fafafa",
            "primary-foreground": "#18181b",
            secondary: "#27272a",
            "secondary-foreground": "#fafafa",
            card: "#09090b",
            "card-foreground": "#fafafa",
            border: "#27272a",
            radius: "0.5rem"
          }
        };

        const cleanTokens = getTokensFromStyles(cleanStyles as any);
        const newProjId = `proj-${Date.now()}`;
        const newProj: Project = {
          id: newProjId,
          name,
          tokens: cleanTokens,
          customElements: []
        };

        const finalProjectsList = [...updatedProjects, newProj];
        const nextThemeStyles = syncTokensToStyles(cleanTokens, get().themeState.styles);

        set({
          projects: finalProjectsList,
          activeProjectId: newProjId,
          tokens: cleanTokens,
          customElements: [],
          selectedLayerId: null,
          selectedGroupName: null,
          themeState: {
            ...get().themeState,
            styles: nextThemeStyles
          }
        });
      },

      deleteProject: (projectId) => {
        if (projectId === "proj-shadcn") {
          alert("Default template project cannot be deleted!");
          return;
        }

        const filtered = get().projects.filter(p => p.id !== projectId);
        
        set({ projects: filtered });
        if (get().activeProjectId === projectId) {
          get().switchProject("proj-shadcn");
        }
      },

      resetDefaultProject: () => {
        const nextProjects = get().projects.map(p => {
          if (p.id === "proj-shadcn") {
            return {
              ...p,
              tokens: initialDefaultTokens,
              customElements: DEFAULT_SaaS_ELEMENTS
            };
          }
          return p;
        });

        set({ projects: nextProjects });
        if (get().activeProjectId === "proj-shadcn") {
          const nextStyles = syncTokensToStyles(initialDefaultTokens, get().themeState.styles);
          set({
            tokens: initialDefaultTokens,
            customElements: DEFAULT_SaaS_ELEMENTS,
            selectedLayerId: null,
            themeState: {
              ...get().themeState,
              styles: nextStyles
            }
          });
        }
      }
    }),
    {
      name: "editor-storage",
    }
  )
);
