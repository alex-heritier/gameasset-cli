import * as fs from 'fs-extra';
import * as path from 'path';
import { Asset, SearchOptions, SearchResult } from '../types';
import { AssetSource } from '../services/AssetSource';
import { Storage } from '../storage/Storage';
import { sanitizeFilename } from '../utils/filename';

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

  private async runSearchPipeline(options: SearchOptions): Promise<SearchResult> {
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
        const info = await source.getAssetFileInfo(asset.link);
        if (info.fileType) {
          asset.fileType = info.fileType;
        }
      } catch {
        // Continue without file type if fetch fails
      }
    }

    if (options.fileType) {
      const filterType = options.fileType.toUpperCase();
      assets = assets.filter(a => a.fileType === filterType);
    }

    return {
      assets,
      totalFound: assets.length,
      source: source.name,
      query: options.query,
    };
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    const result = await this.runSearchPipeline(options);

    this.lastSearchResult = result;
    await this.storage.saveLastSearch(result.source, result.query);
    await this.storage.save(result.assets);

    return result;
  }

  async searchInternal(options: SearchOptions): Promise<SearchResult> {
    return this.runSearchPipeline(options);
  }

  async saveSearchResults(assets: Asset[], query: string): Promise<void> {
    const sources = new Set(assets.map(a => a.source));
    const sourceName = sources.size === 1 ? Array.from(sources)[0] : 'all';
    
    this.lastSearchResult = {
      assets,
      totalFound: assets.length,
      source: sourceName,
      query,
    };

    await this.storage.saveLastSearch(sourceName, query);
    await this.storage.save(assets);
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
    const info = await source.getAssetFileInfo(asset.link);

    if (!info.download) {
      throw new Error(`Could not find download URL for asset: ${asset.title}`);
    }

    const safeFilename = sanitizeFilename(info.download.filename);
    const filepath = path.join(outputDir, safeFilename);
    const result = await source.downloadAsset(info.download.url, filepath);

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
}
