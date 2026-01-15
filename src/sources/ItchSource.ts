import { load } from 'cheerio';
import { Asset, SearchOptions } from '../types';
import { BaseAssetSource } from '../services/AssetSource';
import { PageFetcher } from '../services/PageFetcher';

export class ItchSource extends BaseAssetSource {
  readonly name = 'itch';
  readonly displayName = 'itch.io';

  constructor(fetcher: PageFetcher) {
    super(fetcher);
  }

  buildSearchUrl(options: SearchOptions): string {
    let url = `https://itch.io/game-assets/free?q=${encodeURIComponent(options.query)}`;
    if (options.is2D) url += '&tag=2d';
    if (options.is3D) url += '&tag=3d';
    if (options.tag) url += `&tag=${encodeURIComponent(options.tag)}`;
    return url;
  }

  parseSearchResults(html: string, limit: number): Asset[] {
    const $ = load(html);
    const results: Asset[] = [];

    $('.game_cell').each((i, elem) => {
      if (results.length >= limit) return;

      const $elem = $(elem);
      const titleElem = $elem.find('.game_title .title');
      const link = titleElem.attr('href') || '';
      const title = titleElem.text().trim() || 'Untitled';
      const author = $elem.find('.game_author a').text().trim() || 'Unknown';
      const cover = $elem.find('.game_thumb img').attr('data-lazy_src') || $elem.find('.game_thumb img').attr('src');

      if (link && title !== 'Untitled') {
        results.push({
          title,
          author,
          link: link.startsWith('http') ? link : 'https://itch.io' + link,
          cover: cover ? this.ensureHttps(cover) : undefined,
          source: this.name,
        });
      }
    });

    return results;
  }

  async extractDownloadUrl(html: string, assetUrl: string): Promise<{ url: string; filename: string } | null> {
    const $ = load(html);

    const downloadBtn = $('.upload_list .button[href*="/download"]').first();
    if (downloadBtn.length > 0) {
      const href = downloadBtn.attr('href');
      if (href) return { url: 'https://itch.io' + href, filename: 'download.zip' };
    }

    const directDownload = $('.file_download .download_btn .link').first();
    if (directDownload.length > 0) {
      const href = directDownload.attr('href');
      if (href) return { url: href, filename: 'download.zip' };
    }

    const metaDownload = $('meta[property="og:url"]').attr('content');
    if (metaDownload && metaDownload.includes('/download')) {
      return { url: metaDownload, filename: 'download.zip' };
    }

    const uploadLinks = $('.upload_list .upload a[href*="https://"]');
    if (uploadLinks.length > 0) {
      const href = uploadLinks.first().attr('href');
      if (href) return { url: href, filename: 'download.zip' };
    }

    const uploadNames = $('.upload_name .name');
    if (uploadNames.length > 0) {
      const filename = uploadNames.first().attr('title') || uploadNames.first().text().trim();
      if (filename) {
        return { url: assetUrl, filename };
      }
    }

    return null;
  }
}
