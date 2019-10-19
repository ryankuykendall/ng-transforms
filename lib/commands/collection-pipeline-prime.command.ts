import program from 'commander';
import process from 'process';
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
  console.info('All primeable directories', directories);
  return;

  directories.forEach(directory => {
    process.chdir(directory);
    console.info('Changing to pipeline directory', process.cwd());
    process.chdir('-');
    console.info('Changing back to initial directory', process.cwd());
  });
};
