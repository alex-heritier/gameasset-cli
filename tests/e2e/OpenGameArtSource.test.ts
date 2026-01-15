import { describe, it, expect, mock } from 'bun:test';
import { OpenGameArtSource } from '../../src/sources/OpenGameArtSource';
import { PageFetcher } from '../../src/services/PageFetcher';

describe('OpenGameArtSource E2E Tests', () => {
  const mockFetcher = {
    fetch: mock(() => Promise.resolve('')),
    downloadFile: mock(() => Promise.resolve({ success: true, filename: 'test.zip' })),
  } as PageFetcher;

  const source = new OpenGameArtSource(mockFetcher);

  it('should build search URL correctly', () => {
    const options = {
      query: 'opengameart assets',
      limit: 10,
      source: 'opengameart',
    };

    const url = source.buildSearchUrl(options);
    expect(url).toBe('https://opengameart.org/art-search?keys=opengameart%20assets');
  });

  it('should parse search results correctly', () => {
    const html = `
      <div class="views-row art-previews-inline">
        <div class="field-name-title">
          <a href="/node/123">Test OpenGameArt Asset</a>
        </div>
        <div class="field-name-field-art-preview">
          <img src="http://opengameart.org/cover.jpg" />
        </div>
        <div class="username">Test Author</div>
      </div>
    `;

    const results = source.parseSearchResults(html, 5);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      title: 'Test OpenGameArt Asset',
      author: 'Test Author',
      link: 'https://opengameart.org/node/123',
      cover: 'https://opengameart.org/cover.jpg',
      source: 'opengameart',
    });
  });

  it('should extract download URL from asset page', async () => {
    const html = `
      <div class="field-name-field-art-files">
        <div class="file">
          <a href="http://opengameart.org/download/test.zip">Download</a>
        </div>
      </div>
    `;

    const result = await source.extractDownloadUrl(html, 'https://opengameart.org/node/123');
    expect(result).toEqual({ url: 'https://opengameart.org/download/test.zip', filename: 'Download' });
  });

  it('should support 2D and 3D', () => {
    expect(source.supports2D()).toBe(true);
    expect(source.supports3D()).toBe(true);
  });
});