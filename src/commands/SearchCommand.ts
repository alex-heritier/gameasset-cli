import { Command } from 'commander';
import chalk from 'chalk';
import { AssetRepository } from '../repositories/AssetRepository';
import { SearchOptions } from '../types';

const DEFAULT_SEARCH_LIMIT = 20;
const MAX_SEARCH_LIMIT = 100;

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
      .option('-l, --limit <number>', 'Maximum results (default: 20)', '20')
      .option('-s, --source <source>', `Source to search (default: itch)`, 'itch')
      .option('--type <type>', 'Filter by file type (png, zip, mp3, etc.)')
      .option('--json', 'Output results as JSON')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  private async execute(options: any): Promise<void> {
    const limit = Math.min(parseInt(options.limit, 10) || DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT);

    const searchOptions: SearchOptions = {
      query: options.query,
      is2D: options['2d'] || false,
      is3D: options['3d'] || false,
      tag: options.tag,
      limit,
      source: options.source,
      fileType: options.type,
    };

    try {
      console.log(chalk.cyan(`\nSearching ${this.getSourceName(options.source)} for "${options.query}"...`));

      const result = await this.repository.search(searchOptions);

      if (result.assets.length === 0) {
        console.log(chalk.yellow('\nNo results found.'));
        return;
      }

      console.log(chalk.green(`\nFound ${result.totalFound} asset(s):\n`));

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        this.displayResults(result.assets, options.source);
      }
    } catch (error: any) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  }

  private getSourceName(source: string): string {
    const info = this.repository.getSourceInfo(source);
    return info?.displayName || source;
  }

  private displayResults(assets: any[], source: string): void {
    const sourceName = this.getSourceName(source);
    
    assets.forEach((asset, index) => {
      const number = chalk.dim(`[${index + 1}]`);
      const title = chalk.white(asset.title);
      const author = chalk.dim(`by ${asset.author}`);
      const link = chalk.cyan.underline(asset.link);
      
      console.log(`${number} ${title} ${author}`);
      console.log(`    ${link}`);

      if (asset.cover) {
        console.log(`    ${chalk.dim('Cover:')} ${asset.cover}`);
      }

      if (asset.fileType) {
        console.log(`    ${chalk.dim('Type:')} ${asset.fileType.toUpperCase()}`);
      }

      console.log(`    ${chalk.dim('Source:')} ${sourceName}`);
      console.log();
    });
  }
}
