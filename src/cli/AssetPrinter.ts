import chalk from 'chalk';
import { Asset } from '../types';

export class AssetPrinter {
  static print(asset: Asset, index?: number): void {
    const number = index !== undefined ? chalk.dim(`[${index + 1}]`) : '';
    const title = chalk.white(asset.title);
    const author = chalk.dim(`by ${asset.author}`);
    const link = chalk.cyan.underline(asset.link);

    console.log(`${number} ${title} ${author}`);
    console.log(`    ${link}`);

    if (asset.cover) {
      console.log(`    ${chalk.dim('Cover:')} ${asset.cover}`);
    }

    if (asset.fileType) {
      console.log(`    ${chalk.dim('Type:')} ${asset.fileType}`);
    }

    console.log(`    ${chalk.dim('Source:')} ${asset.source}`);
    console.log();
  }
}
