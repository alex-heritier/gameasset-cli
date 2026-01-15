import * as fs from 'fs-extra';
import * as path from 'path';
import { Asset, SearchOptions, SearchResult } from '../types';
import { AssetSource } from '../services/AssetSource';
import { Storage } from '../storage/Storage';

const MAX_FILENAME_LENGTH = 100;
const DEFAULT_SEARCH_LIMIT = 20;
const MAX_SEARCH_LIMIT = 100;

export class AssetRepository {
  private sources = new Map<string, AssetSource>();
  private lastSearchResult: SearchResult | null = null;

  constructor(private storage: Storage) {}

  registerSource(source: AssetSource): void {
    this.sources.set(source.name, source);
  }

  getSource(name: string): AssetSource | undefined {
    return this.sources.get(name);
  }

  getAvailableSources(): string[] {
    return Array.from(this.sources.keys());
  }

  getSourceInfo(name: string): { name: string; displayName: string; supports2D: boolean; supports3D: boolean } | null {
    const source = this.sources.get(name);
    if (!source) return null;
    return {
      name: source.name,
      displayName: source.displayName,
      supports2D: source.supports2D(),
      supports3D: source.supports3D(),
    };
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    const source = this.sources.get(options.source);
    if (!source) {
      throw new Error(`Unknown source: ${options.source}. Available sources: ${this.getAvailableSources().join(', ')}`);
    }

    if (!source.isSearchable()) {
      throw new Error(`Source '${source.displayName}' does not support searching`);
    }

    const url = source.buildSearchUrl(options);
    const html = await source.fetcher.fetch(url);
    let assets = source.parseSearchResults(html, options.limit);

    for (const asset of assets) {
      try {
        const assetHtml = await source.fetcher.fetch(asset.link);
        const downloadInfo = await source.extractDownloadUrl(assetHtml, asset.link);
        if (downloadInfo) {
          const ext = downloadInfo.filename.split('.').pop()?.toUpperCase() || '';
          asset.fileType = ext;
        }
      } catch {
        // Continue without file type if fetch fails
      }
    }

    if (options.fileType) {
      const filterType = options.fileType.toUpperCase();
      assets = assets.filter(a => a.fileType === filterType);
    }

    this.lastSearchResult = {
      assets,
      totalFound: assets.length,
      source: source.name,
      query: options.query,
    };

    await this.storage.saveLastSearch(source.name, options.query);
    await this.storage.save(assets);

    return this.lastSearchResult;
  }

  async download(asset: Asset, outputDir: string = '.'): Promise<string | null> {
    const source = this.sources.get(asset.source);
    if (!source) {
      throw new Error(`Unknown source: ${asset.source}`);
    }

    if (!source.isDownloadable()) {
      throw new Error(`Source '${source.displayName}' does not support downloading`);
    }

    await fs.ensureDir(outputDir);
    const assetHtml = await source.fetcher.fetch(asset.link);
    const downloadInfo = await source.extractDownloadUrl(assetHtml, asset.link);

    if (!downloadInfo) {
      throw new Error(`Could not find download URL for asset: ${asset.title}`);
    }

    const safeFilename = this.sanitizeFilename(downloadInfo.filename);
    const filepath = path.join(outputDir, safeFilename);
    const result = await source.downloadAsset(downloadInfo.url, filepath);

    if (!result.success) {
      throw new Error(`Download failed: ${result.error}`);
    }

    return filepath;
  }

  getLastSearchResult(): SearchResult | null {
    if (this.lastSearchResult) {
      return this.lastSearchResult;
    }
    return null;
  }

  async loadLastSearchFromStorage(): Promise<SearchResult | null> {
    const lastSearch = await this.storage.getLastSearch();
    if (!lastSearch) {
      return null;
    }

    const assets = await this.storage.load();
    if (assets.length === 0) {
      return null;
    }

    return {
      assets,
      totalFound: assets.length,
      source: lastSearch.source,
      query: lastSearch.query,
    };
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/[^\w\-.]/g, '')
      .slice(0, MAX_FILENAME_LENGTH);
  }
}
