import program from 'commander';
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import * as fileutil from './../utils/file.util';
import { ICollectionGroup } from './../interfaces/collection-pipeline.interface';
import logger from './../utils/logger.util';
import {
  loadCollectionGroupFromFilepath,
  CollectionGroup,
  CollectionPipeline,
} from './../utils/collection-pipeline.util';

export const action = (filepath: string, label: string, cmd: program.Command) => {
  const groupFilepath = path.resolve(filepath);
  if (!fs.existsSync(groupFilepath)) logger.error('Unable to load collection group', groupFilepath);
  const group: CollectionGroup = loadCollectionGroupFromFilepath(groupFilepath);
  const pipeline: CollectionPipeline | undefined = group.getPipeline(label);
  if (!pipeline) logger.error('No pipeline labeled', label, 'in group');
  logger.info('Pipeline', JSON.stringify(pipeline, null, 2));
};
