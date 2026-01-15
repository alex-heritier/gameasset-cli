import { Asset, SearchOptions, DownloadResult } from '../types';
import { PageFetcher } from './PageFetcher';

const MAX_FILENAME_LENGTH = 200;

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
}
