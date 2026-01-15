# AGENTS.md - Game Asset CLI Development Guide

This document provides guidelines for AI agents working on the gameasset-cli project.

## Project Overview

**gameasset-dl** is a modern CLI tool written in TypeScript for searching and downloading free game assets from multiple sources (itch.io, Kenney Assets, OpenGameArt). The project follows clean architecture principles with separation of concerns and extensibility.

## Build & Development Commands

### Core Commands
```bash
# Install dependencies
bun install

# Build TypeScript to JavaScript
bun run build

# Run in development mode (direct TypeScript execution)
bun run dev

# Run all tests
bun test

# Run linting
bun run lint

# Start the CLI
bun run start
```

### Testing Commands
```bash
# Run specific test file
bun test tests/e2e/ItchSource.test.ts

# Run tests with pattern matching
bun test --pattern "ItchSource"

# Run tests with coverage
bun test --coverage

# Run tests in watch mode
bun test --watch
```

### Single Test Execution
```bash
# Run a specific test by name
bun test --test-name "should build search URL correctly"

# Run tests from specific directory
bun test tests/e2e/
```

## Code Style Guidelines

### TypeScript Configuration
- **Target**: ES2020
- **Module**: CommonJS
- **Strict mode**: Enabled
- **Declaration files**: Enabled for all TypeScript files
- **Source maps**: Enabled for debugging

### Import Organization
```typescript
// External dependencies first
import { Command } from 'commander';
import chalk from 'chalk';

// Internal modules grouped by feature
import { SearchCommand } from './commands/SearchCommand';
import { AssetRepository } from './repositories/AssetRepository';
import { ItchSource } from './sources/ItchSource';
import { Asset, SearchOptions } from './types';
```

### Naming Conventions
- **Classes**: PascalCase (e.g., `SearchCommand`, `AssetRepository`)
- **Interfaces**: PascalCase (e.g., `Asset`, `SearchOptions`)
- **Methods/Functions**: camelCase (e.g., `buildSearchUrl`, `parseSearchResults`)
- **Variables/Constants**: camelCase (e.g., `searchResults`, `DEFAULT_LIMIT`)
- **Private members**: camelCase with underscore prefix NOT used (use TypeScript `private` modifier)
- **Source names**: lowercase (e.g., `itch`, `kenney`, `opengameart`)

### File Structure
```
src/
├── commands/          # CLI command handlers (PascalCase)
├── repositories/      # Data access layer (PascalCase)
├── services/         # Core business logic (PascalCase)
├── sources/          # Asset source implementations (PascalCase)
├── storage/          # Persistence layer (PascalCase)
├── types.ts          # Type definitions
└── main.ts           # Application entry point
```

### TypeScript Best Practices
1. **Explicit Types**: Always define return types and parameter types
2. **Interface over Type**: Prefer `interface` for object shapes
3. **Strict Null Checks**: Handle optional properties with `?` operator
4. **Error Types**: Use `any` only when necessary, prefer specific error types
5. **Async/Await**: Use async/await over promise chains for readability

### Error Handling
```typescript
// Use try-catch with specific error messages
try {
  const result = await this.repository.searchInternal(searchOptions);
} catch (error: any) {
  console.error(chalk.red(`\nError: ${error.message}`));
  process.exit(1);
}

// Return meaningful error objects
interface DownloadResult {
  success: boolean;
  filepath?: string;
  filename: string;
  error?: string;
  sizeMb?: number;
}
```

### CLI Output Formatting
- Use `chalk` for colored output
- Format lists with clear numbering: `[1]`, `[2]`, etc.
- Include source information for each asset
- Support both human-readable and JSON output formats

### Testing Patterns
```typescript
// Use Bun's built-in testing framework
import { describe, it, expect, mock } from 'bun:test';

// Mock dependencies properly
const mockFetcher = {
  fetch: mock(() => Promise.resolve('')),
  downloadFile: mock(() => Promise.resolve({ success: true, filename: 'test.zip' })),
} as PageFetcher;

// Test both happy path and edge cases
describe('ItchSource', () => {
  it('should build search URL correctly', () => {
    // Test implementation
  });
  
  it('should handle empty results gracefully', () => {
    // Edge case test
  });
});
```

### Adding New Asset Sources
1. Create a new class extending `BaseAssetSource` in `src/sources/`
2. Implement required methods: `buildSearchUrl`, `parseSearchResults`, `extractDownloadUrl`
3. Register the source in `main.ts` via `repository.registerSource()`
4. Add corresponding E2E tests in `tests/e2e/`

### Code Quality Requirements
- **No ESLint errors**: Run `bun run lint` before committing
- **TypeScript compilation**: Must pass `bun run build` without errors
- **Test coverage**: Maintain existing test patterns for new features
- **Documentation**: Update README.md when adding new features

### Commit Message Convention
- Use present tense: "Add feature" not "Added feature"
- Start with verb: "Fix", "Add", "Update", "Refactor", "Remove"
- Reference issue numbers when applicable
- Keep first line under 50 characters

### Project-Specific Patterns
1. **Asset Sources**: Follow the interface pattern in existing sources
2. **CLI Commands**: Use Commander.js with consistent option patterns
3. **Error Messages**: User-friendly with chalk formatting
4. **File Storage**: Use `search-results.json` for persistence
5. **Configuration**: Environment variables for API keys if needed

### Performance Considerations
- Limit search results with `MAX_SEARCH_LIMIT = 100`
- Implement pagination for large result sets
- Cache frequently accessed data when appropriate
- Use async operations for network requests

### Security Guidelines
- Validate user input in CLI commands
- Sanitize URLs before making requests
- Handle file paths safely to prevent directory traversal
- Use HTTPS for all external requests
- Never commit API keys or secrets

## Development Workflow

1. **Setup**: `bun install`
2. **Develop**: `bun run dev` for live testing
3. **Test**: `bun test` to verify changes
4. **Build**: `bun run build` before committing
5. **Lint**: `bun run lint` for code quality

## Notes for AI Agents

- This project uses **Bun** as the runtime, not Node.js
- Tests are written using Bun's built-in test framework
- The architecture follows clean and SOLID architecture principles
- New features should maintain backward compatibility
- Always check for existing patterns before implementing new functionality
