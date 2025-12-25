import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

// Mock dependencies
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <div data-testid="file-system-provider">{children}</div>,
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <div data-testid="chat-provider">{children}</div>,
}));

vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Header</div>,
}));

vi.mock("@/components/ui/resizable", () => ({
  ResizableHandle: ({ className }: any) => <div className={className} data-testid="resizable-handle" />,
  ResizablePanel: ({ children, className }: any) => <div className={className} data-testid="resizable-panel">{children}</div>,
  ResizablePanelGroup: ({ children, className }: any) => <div className={className} data-testid="resizable-panel-group">{children}</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

test("renders with preview tab active by default", () => {
  render(<MainContent />);

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("file-tree")).toBeNull();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("switches to code view when code tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Initially should show preview
  expect(screen.getByTestId("preview-frame")).toBeDefined();

  // Find and click the Code tab
  const codeTab = screen.getByRole("tab", { name: /code/i });
  await user.click(codeTab);

  // Should now show code view
  await waitFor(() => {
    expect(screen.queryByTestId("preview-frame")).toBeNull();
    expect(screen.getByTestId("file-tree")).toBeDefined();
    expect(screen.getByTestId("code-editor")).toBeDefined();
  });
});

test("switches back to preview when preview tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  // Click Code tab
  const codeTab = screen.getByRole("tab", { name: /code/i });
  await user.click(codeTab);

  await waitFor(() => {
    expect(screen.getByTestId("file-tree")).toBeDefined();
  });

  // Click Preview tab
  const previewTab = screen.getByRole("tab", { name: /preview/i });
  await user.click(previewTab);

  // Should show preview again
  await waitFor(() => {
    expect(screen.getByTestId("preview-frame")).toBeDefined();
    expect(screen.queryByTestId("file-tree")).toBeNull();
    expect(screen.queryByTestId("code-editor")).toBeNull();
  });
});

test("handles rapid tab switching correctly", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const previewTab = screen.getByRole("tab", { name: /preview/i });
  const codeTab = screen.getByRole("tab", { name: /code/i });

  // Rapidly switch tabs multiple times
  await user.click(codeTab);
  await user.click(previewTab);
  await user.click(codeTab);
  await user.click(previewTab);
  await user.click(codeTab);

  // Final state should be code view
  await waitFor(() => {
    expect(screen.getByTestId("file-tree")).toBeDefined();
    expect(screen.getByTestId("code-editor")).toBeDefined();
    expect(screen.queryByTestId("preview-frame")).toBeNull();
  });
});

test("tab states are properly reflected in UI", async () => {
  const user = userEvent.setup();
  render(<MainContent />);

  const previewTab = screen.getByRole("tab", { name: /preview/i });
  const codeTab = screen.getByRole("tab", { name: /code/i });

  // Preview should be active initially
  expect(previewTab).toHaveAttribute("data-state", "active");
  expect(codeTab).toHaveAttribute("data-state", "inactive");

  // Click code tab
  await user.click(codeTab);

  await waitFor(() => {
    expect(previewTab).toHaveAttribute("data-state", "inactive");
    expect(codeTab).toHaveAttribute("data-state", "active");
  });

  // Click preview tab
  await user.click(previewTab);

  await waitFor(() => {
    expect(previewTab).toHaveAttribute("data-state", "active");
    expect(codeTab).toHaveAttribute("data-state", "inactive");
  });
});
