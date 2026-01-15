import { Command } from 'commander';
import chalk from 'chalk';
import { AssetRepository } from '../repositories/AssetRepository';
import { Asset } from '../types';
import { AssetPrinter } from '../cli/AssetPrinter';
import { DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT } from '../config/search';

interface SearchCommandOptions {
  query: string;
  limit: string;
  '2d': boolean;
  '3d': boolean;
  tag: string | undefined;
  source: string | undefined;
  type: string | undefined;
  json: boolean;
}

export class SearchCommand {
  constructor(private program: Command, private repository: AssetRepository) {}

  register(): void {
    this.program
      .command('search')
      .alias('s')
      .description('Search for free game assets')
      .requiredOption('-q, --query <keyword>', 'Search query')
      .option('--2d', 'Filter for 2D assets')
      .option('--3d', 'Filter for 3D assets')
      .option('-t, --tag <tag>', 'Filter by specific tag')
      .option('-l, --limit <number>', 'Maximum results per source (default: 10)', '10')
      .option('-s, --source <source>', `Source to search (all sources if not specified)`)
      .option('--type <type>', 'Filter by file type (png, zip, mp3, etc.)')
      .option('--json', 'Output results as JSON')
      .action(async (options: SearchCommandOptions) => {
        await this.execute(options);
      });
  }

  private async execute(options: SearchCommandOptions): Promise<void> {
    const limit = Math.min(parseInt(options.limit, 10) || DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT);

    try {
      const sources = options.source ? [options.source] : this.repository.getAvailableSources();
      const searchPromises = sources.map((source: string) =>
        this.repository.searchInternal({
          query: options.query,
          is2D: options['2d'] || false,
          is3D: options['3d'] || false,
          tag: options.tag,
          limit,
          source,
          fileType: options.type,
        })
      );

      const searchResults = await Promise.all(searchPromises);
      const allResults: Asset[] = searchResults.flatMap((result) => result.assets);

      if (allResults.length === 0) {
        console.log(chalk.yellow('\nNo results found.'));
        return;
      }

      console.log(chalk.green(`\nFound ${allResults.length} asset(s) across ${sources.length} source(s):\n`));

      if (options.json) {
        console.log(JSON.stringify({ assets: allResults, totalFound: allResults.length }, null, 2));
      } else {
        this.displayResults(allResults);
      }

      await this.repository.saveSearchResults(allResults, options.query);
    } catch (error: any) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  }

  private displayResults(assets: Asset[]): void {
    assets.forEach((asset, index) => {
      AssetPrinter.print(asset, index);
    });
  }
}
