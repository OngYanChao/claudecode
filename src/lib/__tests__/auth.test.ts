import { test, expect, vi, beforeEach } from "vitest";

// Mock server-only to prevent import errors
vi.mock("server-only", () => ({}));

// Mock the cookies function
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock SignJWT from jose
const mockSign = vi.fn().mockResolvedValue("mock-jwt-token");
const mockSignJWT = vi.fn().mockImplementation(() => ({
  setProtectedHeader: vi.fn().mockReturnThis(),
  setExpirationTime: vi.fn().mockReturnThis(),
  setIssuedAt: vi.fn().mockReturnThis(),
  sign: mockSign,
}));

vi.mock("jose", () => ({
  SignJWT: mockSignJWT,
  jwtVerify: vi.fn(),
}));

// Import after mocks are set up
const { createSession } = await import("../auth");

const COOKIE_NAME = "auth-token";

beforeEach(() => {
  vi.clearAllMocks();
});

test("createSession creates a JWT token and sets cookie", async () => {
  const userId = "user-123";
  const email = "test@example.com";

  await createSession(userId, email);

  // Verify SignJWT was called with correct payload
  expect(mockSignJWT).toHaveBeenCalledTimes(1);
  const signJWTPayload = mockSignJWT.mock.calls[0][0];
  expect(signJWTPayload.userId).toBe(userId);
  expect(signJWTPayload.email).toBe(email);
  expect(signJWTPayload.expiresAt).toBeInstanceOf(Date);

  // Verify cookie was set
  expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
  const [cookieName, token, options] = mockCookieStore.set.mock.calls[0];

  expect(cookieName).toBe(COOKIE_NAME);
  expect(token).toBe("mock-jwt-token");

  // Verify cookie options
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
  expect(options.expires).toBeInstanceOf(Date);
});

test("createSession sets secure cookie in production", async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  await createSession("user-123", "test@example.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  expect(options.secure).toBe(true);

  process.env.NODE_ENV = originalEnv;
});

test("createSession sets non-secure cookie in development", async () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";

  await createSession("user-123", "test@example.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  expect(options.secure).toBe(false);

  process.env.NODE_ENV = originalEnv;
});

test("createSession sets expiration to 7 days from now", async () => {
  const beforeCall = Date.now();
  await createSession("user-123", "test@example.com");
  const afterCall = Date.now();

  const [, , options] = mockCookieStore.set.mock.calls[0];
  const expiresAt = options.expires.getTime();

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const expectedMin = beforeCall + sevenDaysMs;
  const expectedMax = afterCall + sevenDaysMs;

  expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
  expect(expiresAt).toBeLessThanOrEqual(expectedMax);
});
