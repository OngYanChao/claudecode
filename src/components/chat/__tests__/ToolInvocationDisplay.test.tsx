import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  ToolInvocationDisplay,
  getToolDisplayMessage,
} from "../ToolInvocationDisplay";

afterEach(() => {
  cleanup();
});

// Unit tests for getToolDisplayMessage

test("getToolDisplayMessage returns 'Creating {path}' for str_replace_editor create command", () => {
  const message = getToolDisplayMessage("str_replace_editor", {
    command: "create",
    path: "/App.jsx",
  });
  expect(message).toBe("Creating /App.jsx");
});

test("getToolDisplayMessage returns 'Creating file' when path is missing for create command", () => {
  const message = getToolDisplayMessage("str_replace_editor", {
    command: "create",
  });
  expect(message).toBe("Creating file");
});

test("getToolDisplayMessage returns 'Editing {path}' for str_replace_editor str_replace command", () => {
  const message = getToolDisplayMessage("str_replace_editor", {
    command: "str_replace",
    path: "/App.jsx",
    old_str: "old",
    new_str: "new",
  });
  expect(message).toBe("Editing /App.jsx");
});

test("getToolDisplayMessage returns 'Editing {path}' for str_replace_editor insert command", () => {
  const message = getToolDisplayMessage("str_replace_editor", {
    command: "insert",
    path: "/App.jsx",
    insert_line: 10,
    new_str: "new content",
  });
  expect(message).toBe("Editing /App.jsx");
});

test("getToolDisplayMessage returns 'Viewing {path}' for str_replace_editor view command", () => {
  const message = getToolDisplayMessage("str_replace_editor", {
    command: "view",
    path: "/App.jsx",
  });
  expect(message).toBe("Viewing /App.jsx");
});

test("getToolDisplayMessage returns 'Viewing {path}' for view command with view_range", () => {
  const message = getToolDisplayMessage("str_replace_editor", {
    command: "view",
    path: "/App.jsx",
    view_range: [1, 50],
  });
  expect(message).toBe("Viewing /App.jsx");
});

test("getToolDisplayMessage returns 'Undoing edit to {path}' for undo_edit command", () => {
  const message = getToolDisplayMessage("str_replace_editor", {
    command: "undo_edit",
    path: "/App.jsx",
  });
  expect(message).toBe("Undoing edit to /App.jsx");
});

test("getToolDisplayMessage returns 'Renaming {path} to {new_path}' for file_manager rename command", () => {
  const message = getToolDisplayMessage("file_manager", {
    command: "rename",
    path: "/old.jsx",
    new_path: "/new.jsx",
  });
  expect(message).toBe("Renaming /old.jsx to /new.jsx");
});

test("getToolDisplayMessage returns 'Renaming {path}' when new_path is missing", () => {
  const message = getToolDisplayMessage("file_manager", {
    command: "rename",
    path: "/old.jsx",
  });
  expect(message).toBe("Renaming /old.jsx");
});

test("getToolDisplayMessage returns 'Deleting {path}' for file_manager delete command", () => {
  const message = getToolDisplayMessage("file_manager", {
    command: "delete",
    path: "/App.jsx",
  });
  expect(message).toBe("Deleting /App.jsx");
});

test("getToolDisplayMessage returns toolName for unknown tool", () => {
  const message = getToolDisplayMessage("unknown_tool", {
    command: "something",
    path: "/file.jsx",
  });
  expect(message).toBe("unknown_tool");
});

test("getToolDisplayMessage returns toolName for unknown command", () => {
  const message = getToolDisplayMessage("str_replace_editor", {
    command: "unknown_command",
    path: "/App.jsx",
  });
  expect(message).toBe("str_replace_editor");
});

test("getToolDisplayMessage returns toolName when args is empty", () => {
  const message = getToolDisplayMessage("str_replace_editor", {});
  expect(message).toBe("str_replace_editor");
});

test("getToolDisplayMessage returns toolName when command is missing", () => {
  const message = getToolDisplayMessage("str_replace_editor", {
    path: "/App.jsx",
  });
  expect(message).toBe("str_replace_editor");
});

// Component tests

test("ToolInvocationDisplay shows spinner when loading", () => {
  const { container } = render(
    <ToolInvocationDisplay
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="pending"
    />
  );

  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeDefined();
});

test("ToolInvocationDisplay shows green dot when complete", () => {
  const { container } = render(
    <ToolInvocationDisplay
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result="Success"
    />
  );

  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).toBeDefined();
});

test("ToolInvocationDisplay shows spinner when state is result but result is undefined", () => {
  const { container } = render(
    <ToolInvocationDisplay
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result={undefined}
    />
  );

  const spinner = container.querySelector(".animate-spin");
  expect(spinner).toBeDefined();
});

test("ToolInvocationDisplay shows green dot when result is empty string", () => {
  const { container } = render(
    <ToolInvocationDisplay
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result=""
    />
  );

  const greenDot = container.querySelector(".bg-emerald-500");
  expect(greenDot).toBeDefined();
});

test("ToolInvocationDisplay renders with correct styling", () => {
  const { container } = render(
    <ToolInvocationDisplay
      toolName="str_replace_editor"
      args={{ command: "create", path: "/App.jsx" }}
      state="result"
      result="Success"
    />
  );

  const wrapper = container.firstChild as HTMLElement;
  expect(wrapper.className).toContain("inline-flex");
  expect(wrapper.className).toContain("bg-neutral-50");
  expect(wrapper.className).toContain("rounded-lg");
});

test("ToolInvocationDisplay handles file_manager delete correctly", () => {
  render(
    <ToolInvocationDisplay
      toolName="file_manager"
      args={{ command: "delete", path: "/old-file.jsx" }}
      state="result"
      result={{ success: true }}
    />
  );

  expect(screen.getByText("Deleting /old-file.jsx")).toBeDefined();
});

test("ToolInvocationDisplay handles file_manager rename correctly", () => {
  render(
    <ToolInvocationDisplay
      toolName="file_manager"
      args={{ command: "rename", path: "/old.jsx", new_path: "/new.jsx" }}
      state="result"
      result={{ success: true }}
    />
  );

  expect(screen.getByText("Renaming /old.jsx to /new.jsx")).toBeDefined();
});

test("ToolInvocationDisplay falls back to toolName for empty args", () => {
  render(
    <ToolInvocationDisplay
      toolName="str_replace_editor"
      args={{}}
      state="pending"
    />
  );

  expect(screen.getByText("str_replace_editor")).toBeDefined();
});
