export interface Asset {
  title: string;
  author: string;
  link: string;
  cover?: string;
  source: string;
}

export interface SearchOptions {
  query: string;
  is2D?: boolean;
  is3D?: boolean;
  tag?: string;
  limit: number;
  source: string;
}

export interface DownloadResult {
  success: boolean;
  filepath?: string;
  filename: string;
  error?: string;
  sizeMb?: number;
}

export interface SearchResult {
  assets: Asset[];
  totalFound: number;
  source: string;
  query: string;
}
