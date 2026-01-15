import { load } from 'cheerio';
import { Asset, SearchOptions } from '../types';
import { BaseAssetSource } from '../services/AssetSource';
import { PageFetcher } from '../services/PageFetcher';

export class KenneySource extends BaseAssetSource {
  readonly name = 'kenney';
  readonly displayName = 'Kenney Assets';

  constructor(fetcher: PageFetcher) {
    super(fetcher);
  }

  supports2D(): boolean { return true; }
  supports3D(): boolean { return true; }

  buildSearchUrl(options: SearchOptions): string {
    let url = `https://kenney.nl/assets?q=${encodeURIComponent(options.query)}&type=game+assets&price=free`;
    return url;
  }

  parseSearchResults(html: string, limit: number): Asset[] {
    const $ = load(html);
    const results: Asset[] = [];

    $('.asset').each((i, elem) => {
      if (results.length >= limit) return;

      const $elem = $(elem);
      const titleElem = $elem.find('h2 a');
      const title = titleElem.text().trim() || 'Untitled';
      const href = titleElem.attr('href');
      const link = href ? href : '';
      const cover = $elem.find('.cover').css('background-image');
      const coverMatch = cover ? cover.match(/url\(["']?([^"')]+)["']?\)/) : null;
      const coverUrl = coverMatch ? coverMatch[1] : undefined;

      if (link && title !== 'Untitled' && !link.includes('/category') && !link.includes('/collections')) {
        results.push({
          title,
          author: 'Kenney',
          link,
          cover: coverUrl ? this.ensureHttps(coverUrl) : undefined,
          source: this.name,
        });
      }
    });

    return results;
  }

  async extractDownloadUrl(html: string, assetUrl: string): Promise<{ url: string; filename: string } | null> {
    const $ = load(html);

    const downloadLinks = $('a[href*=".zip"], a[href*=".png"], a[href*=".psd"], a[href*=".blend"]');
    if (downloadLinks.length > 0) {
      const href = downloadLinks.first().attr('href');
      if (href) {
        const filename = href.split('/').pop() || 'download.zip';
        return { url: this.ensureHttps(href), filename };
      }
    }

    const downloadBtn = $('a.btn-primary, a.button-download, .download-btn a').first();
    if (downloadBtn.length > 0) {
      const href = downloadBtn.attr('href');
      if (href) return { url: this.ensureHttps(href), filename: 'download.zip' };
    }

    const metaDownload = $('meta[property="og:url"]').attr('content');
    if (metaDownload) {
      return { url: metaDownload, filename: 'download.zip' };
    }

    return null;
  }
}
