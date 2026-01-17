import * as fs from "fs-extra";
import * as path from "path";
import { Asset } from "../types";

export interface Storage {
  save(assets: Asset[]): Promise<void>;
  load(): Promise<Asset[]>;
  saveLastSearch(source: string, query: string): Promise<void>;
  getLastSearch(): Promise<{ source: string; query: string } | null>;
}

export class FileSystemStorage implements Storage {
  private searchHistoryPath = path.join(process.cwd(), ".search-history.json");

  constructor(private defaultFilename: string = "search-results.json") {}

  async save(assets: Asset[]): Promise<void> {
    const filepath = path.join(process.cwd(), this.defaultFilename);
    await fs.writeJson(filepath, assets, { spaces: 2 });
  }

  async load(): Promise<Asset[]> {
    const filepath = path.join(process.cwd(), this.defaultFilename);
    if (await fs.pathExists(filepath)) {
      return fs.readJson(filepath);
    }
    return [];
  }

  async saveLastSearch(source: string, query: string): Promise<void> {
    await fs.writeJson(
      this.searchHistoryPath,
      { source, query, timestamp: new Date().toISOString() },
      { spaces: 2 },
    );
  }

  async getLastSearch(): Promise<{ source: string; query: string } | null> {
    if (await fs.pathExists(this.searchHistoryPath)) {
      const data = await fs.readJson(this.searchHistoryPath);
      return { source: data.source, query: data.query };
    }
    return null;
  }
}
