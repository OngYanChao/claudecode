import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAuth } from "@/hooks/use-auth";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock actions
const mockSignInAction = vi.fn();
const mockSignUpAction = vi.fn();
vi.mock("@/actions", () => ({
  signIn: (...args: unknown[]) => mockSignInAction(...args),
  signUp: (...args: unknown[]) => mockSignUpAction(...args),
}));

// Mock anon-work-tracker
const mockGetAnonWorkData = vi.fn();
const mockClearAnonWork = vi.fn();
vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: () => mockGetAnonWorkData(),
  clearAnonWork: () => mockClearAnonWork(),
}));

// Mock get-projects
const mockGetProjects = vi.fn();
vi.mock("@/actions/get-projects", () => ({
  getProjects: () => mockGetProjects(),
}));

// Mock create-project
const mockCreateProject = vi.fn();
vi.mock("@/actions/create-project", () => ({
  createProject: (...args: unknown[]) => mockCreateProject(...args),
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("initial state", () => {
    it("should return isLoading as false initially", () => {
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
    });

    it("should return signIn and signUp functions", () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  describe("signIn", () => {
    describe("happy path", () => {
      it("should call signInAction with email and password", async () => {
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockSignInAction).toHaveBeenCalledWith(
          "test@example.com",
          "password123"
        );
      });

      it("should return success result on successful sign in", async () => {
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

        const { result } = renderHook(() => useAuth());

        let signInResult;
        await act(async () => {
          signInResult = await result.current.signIn(
            "test@example.com",
            "password123"
          );
        });

        expect(signInResult).toEqual({ success: true });
      });

      it("should navigate to existing project after successful sign in", async () => {
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([
          { id: "project-123" },
          { id: "project-456" },
        ]);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/project-123");
      });
    });

    describe("with anonymous work", () => {
      it("should create project from anonymous work after sign in", async () => {
        const anonWork = {
          messages: [{ role: "user", content: "test message" }],
          fileSystemData: { "/App.tsx": "export default function App() {}" },
        };
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(anonWork);
        mockCreateProject.mockResolvedValue({ id: "new-project-from-anon" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringContaining("Design from"),
          messages: anonWork.messages,
          data: anonWork.fileSystemData,
        });
      });

      it("should clear anonymous work after creating project", async () => {
        const anonWork = {
          messages: [{ role: "user", content: "test" }],
          fileSystemData: {},
        };
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(anonWork);
        mockCreateProject.mockResolvedValue({ id: "new-project" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockClearAnonWork).toHaveBeenCalled();
      });

      it("should navigate to newly created project from anonymous work", async () => {
        const anonWork = {
          messages: [{ role: "user", content: "test" }],
          fileSystemData: {},
        };
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(anonWork);
        mockCreateProject.mockResolvedValue({ id: "anon-project-id" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
      });

      it("should not create project from empty anonymous work", async () => {
        const emptyAnonWork = {
          messages: [],
          fileSystemData: {},
        };
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(emptyAnonWork);
        mockGetProjects.mockResolvedValue([{ id: "existing-project" }]);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockCreateProject).not.toHaveBeenCalledWith(
          expect.objectContaining({
            messages: [],
          })
        );
        expect(mockGetProjects).toHaveBeenCalled();
      });
    });

    describe("with no existing projects", () => {
      it("should create a new project when user has no projects", async () => {
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue({ id: "new-default-project" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^New Design #\d+$/),
          messages: [],
          data: {},
        });
      });

      it("should navigate to newly created default project", async () => {
        mockSignInAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue({ id: "default-project-id" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/default-project-id");
      });
    });

    describe("error states", () => {
      it("should return error result on failed sign in", async () => {
        mockSignInAction.mockResolvedValue({
          success: false,
          error: "Invalid credentials",
        });

        const { result } = renderHook(() => useAuth());

        let signInResult;
        await act(async () => {
          signInResult = await result.current.signIn(
            "test@example.com",
            "wrongpassword"
          );
        });

        expect(signInResult).toEqual({
          success: false,
          error: "Invalid credentials",
        });
      });

      it("should not call handlePostSignIn on failed sign in", async () => {
        mockSignInAction.mockResolvedValue({
          success: false,
          error: "Invalid credentials",
        });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("test@example.com", "wrongpassword");
        });

        expect(mockGetAnonWorkData).not.toHaveBeenCalled();
        expect(mockGetProjects).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    describe("loading state", () => {
      it("should set isLoading to true during sign in", async () => {
        let resolveSignIn: (value: unknown) => void;
        const signInPromise = new Promise((resolve) => {
          resolveSignIn = resolve;
        });
        mockSignInAction.mockReturnValue(signInPromise);
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

        const { result } = renderHook(() => useAuth());

        expect(result.current.isLoading).toBe(false);

        let signInPromiseResult: Promise<unknown>;
        act(() => {
          signInPromiseResult = result.current.signIn(
            "test@example.com",
            "password123"
          );
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(true);
        });

        await act(async () => {
          resolveSignIn!({ success: true });
          await signInPromiseResult;
        });

        expect(result.current.isLoading).toBe(false);
      });

      it("should set isLoading to false even on error", async () => {
        mockSignInAction.mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          try {
            await result.current.signIn("test@example.com", "password123");
          } catch {
            // Expected error
          }
        });

        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("signUp", () => {
    describe("happy path", () => {
      it("should call signUpAction with email and password", async () => {
        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("new@example.com", "newpassword123");
        });

        expect(mockSignUpAction).toHaveBeenCalledWith(
          "new@example.com",
          "newpassword123"
        );
      });

      it("should return success result on successful sign up", async () => {
        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

        const { result } = renderHook(() => useAuth());

        let signUpResult;
        await act(async () => {
          signUpResult = await result.current.signUp(
            "new@example.com",
            "newpassword123"
          );
        });

        expect(signUpResult).toEqual({ success: true });
      });

      it("should navigate to existing project after successful sign up", async () => {
        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([
          { id: "first-project" },
          { id: "second-project" },
        ]);

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("new@example.com", "newpassword123");
        });

        expect(mockPush).toHaveBeenCalledWith("/first-project");
      });
    });

    describe("with anonymous work", () => {
      it("should create project from anonymous work after sign up", async () => {
        const anonWork = {
          messages: [{ role: "assistant", content: "generated component" }],
          fileSystemData: { "/Button.tsx": "export const Button = () => {}" },
        };
        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(anonWork);
        mockCreateProject.mockResolvedValue({ id: "signup-anon-project" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("new@example.com", "newpassword123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringContaining("Design from"),
          messages: anonWork.messages,
          data: anonWork.fileSystemData,
        });
        expect(mockClearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/signup-anon-project");
      });
    });

    describe("with no existing projects (new user)", () => {
      it("should create a new default project for new user", async () => {
        mockSignUpAction.mockResolvedValue({ success: true });
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([]);
        mockCreateProject.mockResolvedValue({ id: "new-user-project" });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("new@example.com", "newpassword123");
        });

        expect(mockCreateProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^New Design #\d+$/),
          messages: [],
          data: {},
        });
        expect(mockPush).toHaveBeenCalledWith("/new-user-project");
      });
    });

    describe("error states", () => {
      it("should return error result on failed sign up", async () => {
        mockSignUpAction.mockResolvedValue({
          success: false,
          error: "Email already registered",
        });

        const { result } = renderHook(() => useAuth());

        let signUpResult;
        await act(async () => {
          signUpResult = await result.current.signUp(
            "existing@example.com",
            "password123"
          );
        });

        expect(signUpResult).toEqual({
          success: false,
          error: "Email already registered",
        });
      });

      it("should return error for short password", async () => {
        mockSignUpAction.mockResolvedValue({
          success: false,
          error: "Password must be at least 8 characters",
        });

        const { result } = renderHook(() => useAuth());

        let signUpResult;
        await act(async () => {
          signUpResult = await result.current.signUp(
            "new@example.com",
            "short"
          );
        });

        expect(signUpResult).toEqual({
          success: false,
          error: "Password must be at least 8 characters",
        });
      });

      it("should not call handlePostSignIn on failed sign up", async () => {
        mockSignUpAction.mockResolvedValue({
          success: false,
          error: "Email already registered",
        });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signUp("existing@example.com", "password123");
        });

        expect(mockGetAnonWorkData).not.toHaveBeenCalled();
        expect(mockGetProjects).not.toHaveBeenCalled();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    describe("loading state", () => {
      it("should set isLoading to true during sign up", async () => {
        let resolveSignUp: (value: unknown) => void;
        const signUpPromise = new Promise((resolve) => {
          resolveSignUp = resolve;
        });
        mockSignUpAction.mockReturnValue(signUpPromise);
        mockGetAnonWorkData.mockReturnValue(null);
        mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

        const { result } = renderHook(() => useAuth());

        expect(result.current.isLoading).toBe(false);

        let signUpPromiseResult: Promise<unknown>;
        act(() => {
          signUpPromiseResult = result.current.signUp(
            "new@example.com",
            "newpassword123"
          );
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(true);
        });

        await act(async () => {
          resolveSignUp!({ success: true });
          await signUpPromiseResult;
        });

        expect(result.current.isLoading).toBe(false);
      });

      it("should set isLoading to false even on error", async () => {
        mockSignUpAction.mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useAuth());

        await act(async () => {
          try {
            await result.current.signUp("new@example.com", "newpassword123");
          } catch {
            // Expected error
          }
        });

        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle null anonymous work data", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(mockClearAnonWork).not.toHaveBeenCalled();
      expect(mockGetProjects).toHaveBeenCalled();
    });

    it("should handle concurrent sign in/sign up calls", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockSignUpAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([{ id: "project-1" }]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await Promise.all([
          result.current.signIn("test@example.com", "password123"),
          result.current.signUp("new@example.com", "newpassword123"),
        ]);
      });

      expect(mockSignInAction).toHaveBeenCalled();
      expect(mockSignUpAction).toHaveBeenCalled();
    });

    it("should handle empty email and password", async () => {
      mockSignInAction.mockResolvedValue({
        success: false,
        error: "Email and password are required",
      });

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn("", "");
      });

      expect(signInResult).toEqual({
        success: false,
        error: "Email and password are required",
      });
    });

    it("should handle createProject failure", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({
        messages: [{ role: "user", content: "test" }],
        fileSystemData: {},
      });
      mockCreateProject.mockRejectedValue(new Error("Failed to create project"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signIn("test@example.com", "password123");
        } catch {
          // Expected error
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("should handle getProjects failure", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockRejectedValue(new Error("Failed to get projects"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signIn("test@example.com", "password123");
        } catch {
          // Expected error
        }
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
