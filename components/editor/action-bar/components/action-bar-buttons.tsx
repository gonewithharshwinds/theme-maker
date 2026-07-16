import { Separator } from "@/components/ui/separator";
import { useAIThemeGenerationCore } from "@/hooks/use-ai-theme-generation-core";
import { useEditorStore } from "@/store/editor-store";
import { useThemePresetStore } from "@/store/theme-preset-store";
import { useThemesData } from "@/hooks/themes";
import { CodeButton } from "./code-button";
import { ImportButton } from "./import-button";
import { MoreOptions } from "./more-options";
import { PublishButton } from "./publish-button";
import { ResetButton } from "./reset-button";
import { SaveButton } from "./save-button";
import { ShareButton } from "./share-button";
import { ThemeToggle } from "./theme-toggle";
import { UndoRedoButtons } from "./undo-redo-buttons";
import { useMemo } from "react";
import { SwatchBook } from "lucide-react";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import { usePreferencesStore } from "@/store/preferences-store";

interface ActionBarButtonsProps {
  onImportClick: () => void;
  onCodeClick: () => void;
  onSaveClick: () => void;
  onShareClick: (id?: string) => void;
  isSaving: boolean;
}

export function ActionBarButtons({
  onImportClick,
  onCodeClick,
  onSaveClick,
  onShareClick,
  isSaving,
}: ActionBarButtonsProps) {
  const { themeState, resetToCurrentPreset, hasUnsavedChanges } = useEditorStore();
  const { isGeneratingTheme } = useAIThemeGenerationCore();
  const { getPreset } = useThemePresetStore();
  const { data: themes } = useThemesData();
  const { pantonePanelOpen, setPantonePanelOpen } = usePreferencesStore();

  const currentPreset = themeState?.preset ? getPreset(themeState?.preset) : undefined;
  const isSavedPreset = !!currentPreset && currentPreset.source === "SAVED";

  const isPublished = useMemo(() => {
    if (!isSavedPreset || !themes || !themeState.preset) return false;
    const theme = themes.find((t) => t.id === themeState.preset);
    return theme?.isPublished ?? false;
  }, [isSavedPreset, themes, themeState.preset]);

  const handleReset = () => {
    resetToCurrentPreset();
  };

  return (
    <div className="flex items-center gap-1">
      <MoreOptions disabled={isGeneratingTheme} />
      <Separator orientation="vertical" className="mx-1 h-8" />
      <ThemeToggle />
      <Separator orientation="vertical" className="mx-1 h-8" />
      <UndoRedoButtons disabled={isGeneratingTheme} />
      <Separator orientation="vertical" className="mx-1 h-8" />
      <ResetButton onClick={handleReset} disabled={!hasUnsavedChanges() || isGeneratingTheme} />
      <div className="hidden items-center gap-1 md:flex">
        <ImportButton onClick={onImportClick} disabled={isGeneratingTheme} />
      </div>
      <Separator orientation="vertical" className="mx-1 h-8" />
      <ShareButton onClick={() => onShareClick(themeState.preset)} disabled={isGeneratingTheme} />
      {isSavedPreset && !hasUnsavedChanges() ? (
        <PublishButton
          themeId={themeState.preset as string}
          isPublished={isPublished}
          disabled={isGeneratingTheme}
        />
      ) : (
        <SaveButton onClick={onSaveClick} isSaving={isSaving} disabled={isGeneratingTheme} />
      )}
      <CodeButton onClick={onCodeClick} disabled={isGeneratingTheme} />
      <Separator orientation="vertical" className="mx-1 h-8" />
      <TooltipWrapper label="Toggle Pantone Colors panel" asChild>
        <Button
          variant={pantonePanelOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setPantonePanelOpen(!pantonePanelOpen)}
          disabled={isGeneratingTheme}
          className="h-8 gap-1.5 px-3 rounded-md"
        >
          <SwatchBook className="size-3.5" />
          <span className="hidden text-sm md:block">Pantone</span>
        </Button>
      </TooltipWrapper>
    </div>
  );
}
