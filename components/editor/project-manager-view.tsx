"use client";

import React, { useState } from "react";
import { FolderPlus, Folder, Trash2, RotateCcw, Check, X } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProjectManagerViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectManagerView({ open, onOpenChange }: ProjectManagerViewProps) {
  const projects = useEditorStore((state) => state.projects);
  const activeProjectId = useEditorStore((state) => state.activeProjectId);
  const createNewProject = useEditorStore((state) => state.createNewProject);
  const deleteProject = useEditorStore((state) => state.deleteProject);
  const switchProject = useEditorStore((state) => state.switchProject);
  const resetDefaultProject = useEditorStore((state) => state.resetDefaultProject);

  const [newProjectName, setNewProjectName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    createNewProject(newProjectName.trim());
    toast({
      title: "Project Created",
      description: `Successfully created project "${newProjectName.trim()}"!`,
    });
    setNewProjectName("");
    onOpenChange(false); // Close modal
  };

  const handleSwitch = (id: string, name: string) => {
    switchProject(id);
    toast({
      title: "Project Loaded",
      description: `Switched workspace to "${name}".`,
    });
    onOpenChange(false);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid switching trigger
    const confirmDelete = window.confirm(`Are you sure you want to delete the project "${name}"?`);
    if (confirmDelete) {
      deleteProject(id);
      toast({
        title: "Project Deleted",
        description: `Successfully deleted project "${name}".`,
      });
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmReset = window.confirm(
      "Reset default SaaS template project back to its original layout and tokens? Any changes will be lost."
    );
    if (confirmReset) {
      resetDefaultProject();
      toast({
        title: "Template Reset",
        description: "Successfully restored template project styles and components.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-6 rounded-2xl bg-background border border-border">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Folder className="size-5 text-primary" />
            Projects Workspace Manager
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Manage your design workspaces. Switch between template projects or create your own custom layout sandboxes.
          </DialogDescription>
        </DialogHeader>

        {/* Create New Project form */}
        <form onSubmit={handleCreate} className="mt-4 pb-4 border-b border-border/80 flex items-center gap-2 shrink-0">
          <Input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Enter custom project name..."
            className="flex-1 h-9 text-xs"
            required
          />
          <Button type="submit" size="sm" className="h-9 gap-1.5 shrink-0 px-3">
            <FolderPlus className="size-3.5" />
            Create
          </Button>
        </form>

        {/* Projects List Scroll Area */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 min-h-[200px] max-h-[40vh]">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Available Projects
          </span>

          {projects.map((p) => {
            const isActive = activeProjectId === p.id;
            const isTemplate = p.id === "proj-shadcn";

            return (
              <div
                key={p.id}
                onClick={() => handleSwitch(p.id, p.name)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-xs"
                    : "border-border hover:border-border-hover bg-card/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Folder className="size-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate flex items-center gap-1.5">
                      {p.name}
                      {isActive && (
                        <Check className="size-3 text-green-500 shrink-0" />
                      )}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {p.tokens.length} variables • {p.customElements.length} elements
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isTemplate ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleReset}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Reset Template to Default"
                    >
                      <RotateCcw className="size-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => handleDelete(p.id, p.name, e)}
                      className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      title="Delete Project"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
