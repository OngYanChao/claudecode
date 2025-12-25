# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies and initialize database
npm run setup

# Development server (uses Turbopack)
npm run dev

# Run tests
npm test

# Run a single test file
npx vitest src/lib/__tests__/file-system.test.ts

# Lint
npm run lint

# Build
npm run build

# Reset database
npm run db:reset
```

## Architecture

UIGen is an AI-powered React component generator with live preview. Users describe components in chat, and AI generates code that renders in real-time.

### Core Data Flow

1. **Chat Input** → User describes a component in `ChatInterface`
2. **API Route** (`src/app/api/chat/route.ts`) → Streams AI responses using Vercel AI SDK with tool calls
3. **Tool Execution** → AI uses `str_replace_editor` and `file_manager` tools to create/modify files in a `VirtualFileSystem`
4. **Client Sync** → `FileSystemContext` receives tool calls via streaming and updates the in-memory file system
5. **Live Preview** → `PreviewFrame` transforms JSX files with Babel, creates blob URLs, and renders in a sandboxed iframe

### Virtual File System

The `VirtualFileSystem` class (`src/lib/file-system.ts`) is the central abstraction. Files never touch disk - everything is in-memory:
- Server-side: AI tools operate on VirtualFileSystem instances
- Client-side: `FileSystemContext` wraps a VirtualFileSystem for React components
- Persistence: For authenticated users, file system state serializes to JSON and stores in the `Project.data` field (SQLite via Prisma)

### Preview System

`jsx-transformer.ts` handles the preview pipeline:
- Transforms JSX/TSX using `@babel/standalone` in the browser
- Creates an import map with blob URLs for each transformed file
- Third-party packages resolve via `esm.sh` CDN
- CSS files are collected and injected as a style block
- Missing imports get placeholder modules to prevent crashes

### AI Integration

- Uses Claude via `@ai-sdk/anthropic` (model: claude-haiku-4-5)
- Falls back to `MockLanguageModel` when no API key is set (for development/demo)
- Two AI tools: `str_replace_editor` (view/create/str_replace/insert) and `file_manager` (rename/delete)
- System prompt lives in `src/lib/prompts/generation.tsx`

### Path Aliases

The `@/` alias maps to `src/` (configured in tsconfig.json). The preview system also supports `@/` imports by mapping them to the virtual file system root.

## Development Best Practices

- Use comments sparingly. Only comment for complex code.
- the database schema is defined in the @prisma/schema.prisma file. Reference it anytime you need to understand the structure of data stored in the database.
- vitest config is in vitest.config.mts