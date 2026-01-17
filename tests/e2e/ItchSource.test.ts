import { describe, it, expect, mock } from "bun:test";
import { ItchSource } from "../../src/sources/ItchSource";
import { PageFetcher } from "../../src/services/PageFetcher";

describe("ItchSource E2E Tests", () => {
  const mockFetcher = {
    fetch: mock(() => Promise.resolve("")),
    downloadFile: mock(() =>
      Promise.resolve({ success: true, filename: "test.zip" }),
    ),
  } as PageFetcher;

  const source = new ItchSource(mockFetcher);

  it("should build search URL correctly", () => {
    const options = {
      query: "test assets",
      is2D: true,
      is3D: false,
      tag: "sprites",
      limit: 10,
      source: "itch",
    };

    const url = source.buildSearchUrl(options);
    expect(url).toBe(
      "https://itch.io/game-assets/free?q=test%20assets&tag=2d&tag=sprites",
    );
  });

  it("should parse search results correctly", () => {
    const html = `
      <div class="game_cell">
        <div class="game_title">
          <a class="title" href="/game/123">Test Asset</a>
        </div>
        <div class="game_author">
          <a>Test Author</a>
        </div>
        <div class="game_thumb">
          <img src="http://example.com/cover.jpg" />
        </div>
      </div>
    `;

    const results = source.parseSearchResults(html, 5);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      title: "Test Asset",
      author: "Test Author",
      link: "https://itch.io/game/123",
      cover: "https://example.com/cover.jpg",
      source: "itch",
    });
  });

  it("should extract download URL from asset page", async () => {
    const html = `
      <div class="upload_list">
        <a class="button" href="/download/123">Download</a>
      </div>
    `;

    const result = await source.extractDownloadUrl(
      html,
      "https://itch.io/game/123",
    );
    expect(result).toEqual({
      url: "https://itch.io/download/123",
      filename: "download.zip",
    });
  });

  it("should handle full search and download flow", async () => {
    // Mock search page
    const searchHtml = `
      <div class="game_cell">
        <div class="game_title">
          <a class="title" href="/game/456">Full Test Asset</a>
        </div>
        <div class="game_author">
          <a>Full Author</a>
        </div>
      </div>
    `;

    // Mock asset page
    const assetHtml = `
      <div class="upload_list">
        <a class="button" href="/download/456">Download</a>
      </div>
    `;

    (mockFetcher.fetch as any)
      .mockResolvedValueOnce(searchHtml) // for search
      .mockResolvedValueOnce(assetHtml); // for asset

    const options = { query: "full test", limit: 1, source: "itch" };

    // Simulate the flow
    const searchUrl = source.buildSearchUrl(options);
    expect(searchUrl).toContain("full%20test");

    const results = source.parseSearchResults(searchHtml, options.limit);
    expect(results).toHaveLength(1);

    const asset = results[0];
    const downloadResult = await source.extractDownloadUrl(
      assetHtml,
      asset.link,
    );
    expect(downloadResult).toEqual({
      url: "https://itch.io/download/456",
      filename: "download.zip",
    });

    // Mock download
    const download = await source.downloadAsset(
      downloadResult!.url,
      "/tmp/test.zip",
    );
    expect(download.success).toBe(true);
  });
});
