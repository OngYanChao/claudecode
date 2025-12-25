import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

// Mock the dependencies
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat Interface</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview Frame</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Header Actions</div>,
}));

// Mock ResizablePanel components
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  ResizablePanel: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  ResizableHandle: ({ className }: any) => <div className={className} />,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

test("renders with preview view by default", () => {
  render(<MainContent />);

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("file-tree")).toBeNull();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("switches to code view when code tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Find and click the Code tab
  const codeTab = screen.getByRole("tab", { name: /code/i });
  await user.click(codeTab);

  // Preview should be hidden, code editor and file tree should be visible
  expect(screen.queryByTestId("preview-frame")).toBeNull();
  expect(screen.getByTestId("file-tree")).toBeDefined();
  expect(screen.getByTestId("code-editor")).toBeDefined();
});

test("switches back to preview view when preview tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Switch to code view first
  const codeTab = screen.getByRole("tab", { name: /code/i });
  await user.click(codeTab);

  // Verify we're in code view
  expect(screen.queryByTestId("preview-frame")).toBeNull();
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Switch back to preview
  const previewTab = screen.getByRole("tab", { name: /preview/i });
  await user.click(previewTab);

  // Preview should be visible, code editor should be hidden
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("file-tree")).toBeNull();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("toggles multiple times correctly", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const previewTab = screen.getByRole("tab", { name: /preview/i });
  const codeTab = screen.getByRole("tab", { name: /code/i });

  // Initial state - preview visible
  expect(screen.getByTestId("preview-frame")).toBeDefined();

  // Click code tab
  await user.click(codeTab);
  expect(screen.queryByTestId("preview-frame")).toBeNull();
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Click preview tab
  await user.click(previewTab);
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();

  // Click code tab again
  await user.click(codeTab);
  expect(screen.queryByTestId("preview-frame")).toBeNull();
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Click preview tab again
  await user.click(previewTab);
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("correct tab is marked as active", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const previewTab = screen.getByRole("tab", { name: /preview/i });
  const codeTab = screen.getByRole("tab", { name: /code/i });

  // Initial state - preview should be active
  expect(previewTab.getAttribute("data-state")).toBe("active");
  expect(codeTab.getAttribute("data-state")).toBe("inactive");

  // Click code tab
  await user.click(codeTab);
  expect(previewTab.getAttribute("data-state")).toBe("inactive");
  expect(codeTab.getAttribute("data-state")).toBe("active");

  // Click preview tab
  await user.click(previewTab);
  expect(previewTab.getAttribute("data-state")).toBe("active");
  expect(codeTab.getAttribute("data-state")).toBe("inactive");
});
