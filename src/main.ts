#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { SearchCommand } from './commands/SearchCommand';
import { DownloadCommand } from './commands/DownloadCommand';
import { AssetRepository } from './repositories/AssetRepository';
import { FileSystemStorage } from './storage/Storage';
import { PageFetcher } from './services/PageFetcher';
import { ItchSource } from './sources/ItchSource';
import { KenneySource } from './sources/KenneySource';
import { OpenGameArtSource } from './sources/OpenGameArtSource';

function main(): void {
  const program = new Command();

  program
    .name('gameasset-dl')
    .description('Modern CLI tool to search and download free game assets')
    .version('2.0.0');

  const fetcher = new PageFetcher();
  const storage = new FileSystemStorage('search-results.json');
  const repository = new AssetRepository(storage);

  repository.registerSource(new ItchSource(fetcher));
  repository.registerSource(new KenneySource(fetcher));
  repository.registerSource(new OpenGameArtSource(fetcher));

  new SearchCommand(program, repository).register();
  new DownloadCommand(program, repository).register();

  const sourcesCommand = new Command('sources');
  sourcesCommand.description('List available asset sources');
  sourcesCommand.action(() => {
    console.log(chalk.cyan('\nAvailable Sources:\n'));
    const sources = repository.getAvailableSources();
    sources.forEach(name => {
      const info = repository.getSourceInfo(name);
      if (info) {
        const status = `${info.supports2D ? '2D' : ''} ${info.supports3D ? '3D' : ''}`.trim() || 'All';
        console.log(`  ${chalk.white(info.displayName)} (${chalk.dim(status)})`);
      }
    });
    console.log();
  });
  program.addCommand(sourcesCommand);

  const demoCommand = new Command('demo');
  demoCommand.description('Show demo assets (offline)');
  demoCommand.action(() => {
    console.log(chalk.cyan('\nDemo Assets (Sample Data):\n'));
    
    const demoAssets = [
      {
        title: 'Pixel Art Platformer Pack',
        author: 'Demo Author',
        link: 'https://example.com/pixel-pack',
        source: 'itch',
        cover: 'https://example.com/cover.png'
      },
      {
        title: '3D Fantasy Models',
        author: 'Demo Studio',
        link: 'https://example.com/3d-models',
        source: 'kenney',
        cover: 'https://example.com/cover2.png'
      },
      {
        title: 'RPG Tileset',
        author: 'Demo Games',
        link: 'https://example.com/tileset',
        source: 'opengameart',
        cover: 'https://example.com/cover3.png'
      }
    ];

    demoAssets.forEach((asset, index) => {
      const number = chalk.dim(`[${index + 1}]`);
      const title = chalk.white(asset.title);
      const author = chalk.dim(`by ${asset.author}`);
      const link = chalk.cyan.underline(asset.link);
      
      console.log(`${number} ${title} ${author}`);
      console.log(`    ${link}`);
      console.log(`    ${chalk.dim('Source:')} ${asset.source}`);
      console.log();
    });
  });
  program.addCommand(demoCommand);

  program.parse(process.argv);
}

main();