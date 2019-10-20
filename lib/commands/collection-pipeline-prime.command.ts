import program from 'commander';
import process from 'process';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import logger from './../utils/logger.util';
import {
  loadCollectionGroupFromFilepath,
  CollectionGroup,
  CollectionPipeline,
} from './../utils/collection-pipeline.util';
import { Filepath } from './../interfaces/collection-pipeline.interface';

export const action = (filepath: string, label: string, cmd: program.Command) => {
  const groupFilepath = path.resolve(filepath);
  if (!fs.existsSync(groupFilepath)) {
    logger.error('Unable to load collection group', groupFilepath);
    return 0;
  }

  const group: CollectionGroup = loadCollectionGroupFromFilepath(groupFilepath);
  const pipeline: CollectionPipeline | undefined = group.getPipeline(label);
  if (!pipeline) {
    logger.error('No pipeline labeled', label, 'in group');
    return 0;
  }

  const directories: Filepath[] = pipeline.directoriesForPriming();

  directories.forEach(directory => {
    process.chdir(directory);
    exec('find ./**/*.ts -exec echo {} \\; -exec touch {} \\;', (error, stdout, stderr) => {
      if (error !== null) {
        logger.error('Failed in', directory, error.name, error.message);
      }
      const files: Filepath[] = stdout
        .trim()
        .split(/\s+/)
        .filter(file => file.length > 0);
      if (files.length > 0) {
        logger.info(
          `Files in ${directory}: ${files.length} files`,
          '\n\t - ',
          files.join('\n\t - ')
        );
      } else {
        logger.warn('No files found in', directory);
      }
    });
  });
};
