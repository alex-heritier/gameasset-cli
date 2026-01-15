import { Command } from 'commander';
import chalk from 'chalk';
import { AssetRepository } from '../repositories/AssetRepository';

export class DownloadCommand {
  constructor(private program: Command, private repository: AssetRepository) {}

  register(): void {
    this.program
      .command('download')
      .alias('d')
      .description('Download game assets')
      .argument('[indices...]', 'Asset indices to download (from last search)')
      .option('-o, --output <directory>', 'Output directory', '.')
      .option('-a, --all', 'Download all assets from last search')
      .option('-s, --source <source>', 'Source to download from')
      .option('-l, --link <url>', 'Direct asset URL to download')
      .action(async (indices, options) => {
        await this.execute(indices, options);
      });
  }

  private async execute(indices: string[], options: any): Promise<void> {
    try {
      let lastResult = this.repository.getLastSearchResult();

      if (!lastResult) {
        lastResult = await this.repository.loadLastSearchFromStorage();
      }

      if (!lastResult && !options.link) {
        console.error(chalk.red('\nNo recent search found. Please search first or use --link option.'));
        process.exit(1);
      }

      if (options.link) {
        await this.downloadFromLink(options.link, options.output);
      } else if (options.all) {
        await this.downloadAll(lastResult!, options.output);
      } else if (indices.length > 0) {
        await this.downloadByIndices(lastResult!, indices, options.output);
      } else {
        console.error(chalk.red('\nPlease specify assets to download by index, use --all, or provide --link.'));
        process.exit(1);
      }
    } catch (error: any) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  }

  private async downloadFromLink(link: string, outputDir: string): Promise<void> {
    console.log(chalk.cyan(`\nDownloading from direct link...`));
    console.log(chalk.dim(`Link: ${link}`));
    
    const filepath = await this.repository.download({
      title: 'Direct Download',
      author: 'Unknown',
      link,
      source: 'direct',
    }, outputDir);

    console.log(chalk.green(`\nDownloaded: ${filepath}`));
  }

  private async downloadAll(lastResult: any, outputDir: string): Promise<void> {
    console.log(chalk.cyan(`\nDownloading all ${lastResult.assets.length} assets...`));

    let success = 0;
    let failed = 0;

    for (const asset of lastResult.assets) {
      try {
        process.stdout.write(`Downloading "${asset.title}"... `);
        const filepath = await this.repository.download(asset, outputDir);
        console.log(chalk.green('✓'));
        success++;
      } catch (error: any) {
        console.log(chalk.red('✗'));
        console.log(chalk.dim(`  ${error.message}`));
        failed++;
      }
    }

    console.log(chalk.green(`\nDownloads complete: ${success} successful, ${failed} failed.`));
  }

  private async downloadByIndices(lastResult: any, indices: string[], outputDir: string): Promise<void> {
    const numIndices = indices.map(i => parseInt(i, 10));

    console.log(chalk.cyan(`\nDownloading ${numIndices.length} asset(s)...`));

    let success = 0;
    let failed = 0;

    for (const index of numIndices) {
      if (index < 1 || index > lastResult.assets.length) {
        console.log(chalk.yellow(`\nInvalid index: ${index}`));
        continue;
      }

      const asset = lastResult.assets[index - 1];

      try {
        process.stdout.write(`[${index}] "${asset.title}"... `);
        const filepath = await this.repository.download(asset, outputDir);
        console.log(chalk.green('✓'));
        success++;
      } catch (error: any) {
        console.log(chalk.red('✗'));
        console.log(chalk.dim(`  ${error.message}`));
        failed++;
      }
    }

    console.log(chalk.green(`\nDownloads complete: ${success} successful, ${failed} failed.`));
  }
}
