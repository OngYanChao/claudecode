"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocationDisplayProps {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

export function getToolDisplayMessage(
  toolName: string,
  args: Record<string, unknown>
): string {
  const command = args?.command as string | undefined;
  const path = args?.path as string | undefined;
  const newPath = args?.new_path as string | undefined;

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return path ? `Creating ${path}` : "Creating file";
      case "str_replace":
        return path ? `Editing ${path}` : "Editing file";
      case "insert":
        return path ? `Editing ${path}` : "Editing file";
      case "view":
        return path ? `Viewing ${path}` : "Viewing file";
      case "undo_edit":
        return path ? `Undoing edit to ${path}` : "Undoing edit";
      default:
        return toolName;
    }
  }

  if (toolName === "file_manager") {
    switch (command) {
      case "rename":
        if (path && newPath) {
          return `Renaming ${path} to ${newPath}`;
        }
        return path ? `Renaming ${path}` : "Renaming file";
      case "delete":
        return path ? `Deleting ${path}` : "Deleting file";
      default:
        return toolName;
    }
  }

  return toolName;
}

export function ToolInvocationDisplay({
  toolName,
  args,
  state,
  result,
}: ToolInvocationDisplayProps) {
  const isComplete = state === "result" && result !== undefined;
  const message = getToolDisplayMessage(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{message}</span>
    </div>
  );
}
