import { Asset, SearchOptions, DownloadResult } from '../types';
import { PageFetcher } from './PageFetcher';

export interface AssetSource {
  readonly name: string;
  readonly displayName: string;
  readonly fetcher: PageFetcher;
  supports2D(): boolean;
  supports3D(): boolean;
  buildSearchUrl(options: SearchOptions): string;
  parseSearchResults(html: string, limit: number): Asset[];
  extractDownloadUrl(html: string, assetUrl: string): Promise<{ url: string; filename: string } | null>;
  downloadAsset(downloadUrl: string, filepath: string): Promise<DownloadResult>;
  isSearchable(): boolean;
  isDownloadable(): boolean;
  getAssetFileInfo(assetUrl: string): Promise<{ fileType?: string; download?: { url: string; filename: string } }>;
}

export abstract class BaseAssetSource implements AssetSource {
  abstract readonly name: string;
  abstract readonly displayName: string;

  constructor(public fetcher: PageFetcher) {}

  supports2D(): boolean { return true; }
  supports3D(): boolean { return true; }
  isSearchable(): boolean { return true; }
  isDownloadable(): boolean { return true; }

  abstract buildSearchUrl(options: SearchOptions): string;
  abstract parseSearchResults(html: string, limit: number): Asset[];
  abstract extractDownloadUrl(html: string, assetUrl: string): Promise<{ url: string; filename: string } | null>;

  async downloadAsset(downloadUrl: string, filepath: string): Promise<DownloadResult> {
    return this.fetcher.downloadFile(downloadUrl, filepath);
  }

  async getAssetFileInfo(
    assetUrl: string
  ): Promise<{ fileType?: string; download?: { url: string; filename: string } }> {
    const html = await this.fetcher.fetch(assetUrl);
    const download = await this.extractDownloadUrl(html, assetUrl);

    if (!download) return {};

    const fileType = download.filename
      .split('.')
      .pop()
      ?.toUpperCase();

    return {
      fileType,
      download,
    };
  }

  protected ensureHttps(url: string | undefined): string | undefined {
    if (!url) return undefined;
    return url.replace(/^http:/, 'https:');
  }
}
