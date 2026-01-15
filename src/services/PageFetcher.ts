import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DownloadResult } from '../types';

const FETCH_TIMEOUT_MS = 15000;
const DOWNLOAD_TIMEOUT_MS = 60000;
const MAX_REDIRECTS = 5;

export class PageFetcher {
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  async fetch(url: string): Promise<string> {
    const response: AxiosResponse<string> = await axios.get(url, {
      timeout: FETCH_TIMEOUT_MS,
      headers: { 
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      maxRedirects: MAX_REDIRECTS,
    });
    return response.data;
  }

  async downloadFile(url: string, filepath: string): Promise<DownloadResult> {
    const filename = path.basename(filepath);
    
    try {
      const response: AxiosResponse = await axios.get(url, {
        timeout: DOWNLOAD_TIMEOUT_MS,
        headers: { 'User-Agent': this.userAgent },
        responseType: 'stream',
      });

      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', async () => {
          const stats = await fs.stat(filepath);
          const sizeMb = stats.size / (1024 * 1024);
          resolve({
            success: true,
            filepath,
            filename,
            sizeMb: Math.round(sizeMb * 100) / 100,
          });
        });
        writer.on('error', (error) => {
          reject({
            success: false,
            filename,
            error: error.message,
          });
        });
      });
    } catch (error: any) {
      return {
        success: false,
        filename,
        error: error.message || 'Unknown error during download',
      };
    }
  }
}
