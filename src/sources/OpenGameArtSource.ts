import { load } from "cheerio";
import { Asset, SearchOptions } from "../types";
import { BaseAssetSource } from "../services/AssetSource";
import { PageFetcher } from "../services/PageFetcher";

export class OpenGameArtSource extends BaseAssetSource {
  readonly name = "opengameart";
  readonly displayName = "OpenGameArt";

  constructor(fetcher: PageFetcher) {
    super(fetcher);
  }

  supports2D(): boolean {
    return true;
  }
  supports3D(): boolean {
    return true;
  }

  buildSearchUrl(options: SearchOptions): string {
    let url = `https://opengameart.org/art-search?keys=${encodeURIComponent(options.query)}`;
    return url;
  }

  parseSearchResults(html: string, limit: number): Asset[] {
    const $ = load(html);
    const results: Asset[] = [];

    $(".views-row.art-previews-inline").each((i, elem) => {
      if (results.length >= limit) return;

      const $elem = $(elem);
      const titleElem = $elem.find(".field-name-title a");
      const title = titleElem.text().trim() || "Untitled";
      const href = titleElem.attr("href");
      const link = href ? "https://opengameart.org" + href : "";
      const cover = $elem.find(".field-name-field-art-preview img").attr("src");

      const authorElem = $elem.find(".username, .user-name");
      let author = authorElem.text().trim();
      if (!author) {
        const authorLink = $elem.find(
          '.field-name-field-art-author a, [rel="foaf:maker"] a',
        );
        author = authorLink.text().trim() || "Unknown";
      }

      if (link && title !== "Untitled") {
        results.push({
          title,
          author: author || "OpenGameArt",
          link,
          cover: cover ? this.ensureHttps(cover) : undefined,
          source: this.name,
        });
      }
    });

    return results;
  }

  async extractDownloadUrl(
    html: string,
    assetUrl: string,
  ): Promise<{ url: string; filename: string } | null> {
    const $ = load(html);

    const fileLinks = $(".field-name-field-art-files .file a");
    if (fileLinks.length > 0) {
      const href = fileLinks.first().attr("href");
      const filename =
        fileLinks.first().text().trim().split("\n")[0].trim() || "download";
      if (href) {
        const url = this.ensureHttps(href) || href;
        return { url, filename };
      }
    }

    const downloadLinks = $(
      'a[href*="/download"], .download-links a, .file-download a',
    );
    if (downloadLinks.length > 0) {
      const href = downloadLinks.first().attr("href");
      if (href) {
        const url = this.ensureHttps(href) || href;
        return { url, filename: "download" };
      }
    }

    return null;
  }
}
