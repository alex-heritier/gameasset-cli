import { describe, it, expect, mock } from 'bun:test';
import { KenneySource } from '../../src/sources/KenneySource';
import { PageFetcher } from '../../src/services/PageFetcher';

describe('KenneySource E2E Tests', () => {
  const mockFetcher = {
    fetch: mock(() => Promise.resolve('')),
    downloadFile: mock(() => Promise.resolve({ success: true, filename: 'test.zip' })),
  } as PageFetcher;

  const source = new KenneySource(mockFetcher);

  it('should build search URL correctly', () => {
    const options = {
      query: 'kenney assets',
      limit: 10,
      source: 'kenney',
    };

    const url = source.buildSearchUrl(options);
    expect(url).toBe('https://kenney.nl/assets?q=kenney%20assets&type=game+assets&price=free');
  });

  it('should parse search results correctly', () => {
    const html = `
      <div class="asset">
        <h2><a href="https://kenney.nl/assets/test-asset">Test Kenney Asset</a></h2>
        <div class="cover" style="background-image: url('http://kenney.nl/cover.jpg')"></div>
      </div>
    `;

    const results = source.parseSearchResults(html, 5);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      title: 'Test Kenney Asset',
      author: 'Kenney',
      link: 'https://kenney.nl/assets/test-asset',
      cover: 'https://kenney.nl/cover.jpg',
      source: 'kenney',
    });
  });

  it('should extract download URL from asset page', async () => {
    const html = `
      <a href="https://kenney.nl/download/test.zip">Download</a>
    `;

    const result = await source.extractDownloadUrl(html, 'https://kenney.nl/assets/test');
    expect(result).toEqual({ url: 'https://kenney.nl/download/test.zip', filename: 'test.zip' });
  });

  it('should support 2D and 3D', () => {
    expect(source.supports2D()).toBe(true);
    expect(source.supports3D()).toBe(true);
  });
});