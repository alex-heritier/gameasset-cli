# Game Asset Downloader v2.0

A modern CLI tool to search and download free game assets from multiple sources.

## Features

- **Multiple Sources**: itch.io, Kenney Assets, OpenGameArt
- **Extensible**: Easy to add new asset sources without modifying core code
- **TypeScript**: Full type safety and modern JavaScript features
- **CLI Interface**: Command-line tool with search and download capabilities

## Installation

```bash
bun install -g gameasset-dl
```

## Usage

### Search for assets

```bash
# Basic search
gameasset-dl search -q "pixel art"

# Search with filters
gameasset-dl search -q "sprites" --2d -l 10

# Search specific source
gameasset-dl search -q "models" -s kenney --3d

# JSON output
gameasset-dl search -q "tiles" --json
```

### Download assets

```bash
# Download specific assets by index
gameasset-dl download 1 3 5

# Download all assets from last search
gameasset-dl download --all

# Download to specific directory
gameasset-dl download 1 -o ./assets
```

### List available sources

```bash
gameasset-dl sources
```

## Architecture

This refactored version follows clean architecture principles:

### Separation of Concerns

- **AssetSource**: Handles source-specific logic only
- **PageFetcher**: Manages HTTP requests and downloads
- **AssetRepository**: Coordinates between sources and storage
- **Commands**: Handle CLI interface only
- **Storage**: Manages file persistence only

### Extensibility

- New asset sources can be added by implementing `AssetSource` interface
- No need to modify existing code when adding new sources
- Plugin-based architecture for extensibility

### Dependency Management

- High-level modules depend on abstractions (interfaces)
- Concrete implementations injected via constructor
- Easy to mock and test individual components

### Interface Design

- Small, focused interfaces for each concern
- `AssetSource` interface contains only source-related methods
- `Storage` interface contains only persistence methods

## Project Structure

```
src/
├── commands/          # CLI command handlers
├── repositories/      # Data access layer
├── services/          # Core business logic
├── sources/           # Asset source implementations
├── storage/           # Persistence layer
├── types.ts           # Type definitions
└── main.ts            # Application entry point
```

## Adding New Sources

1. Create a new source class extending `BaseAssetSource`:

```typescript
export class NewSource extends BaseAssetSource {
  readonly name = "newsource";
  readonly displayName = "New Source";

  buildSearchUrl(options: SearchOptions): string {
    // Build search URL for this source
  }

  parseSearchResults(html: string, limit: number): Asset[] {
    // Parse HTML to extract asset information
  }

  async extractDownloadUrl(
    html: string,
    assetUrl: string,
  ): Promise<string | null> {
    // Extract download URL from asset page
  }
}
```

2. Register the source in `main.ts`:

```typescript
repository.registerSource(new NewSource(fetcher));
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Run in development
bun run dev

# Test
bun test
```

## License

MIT
