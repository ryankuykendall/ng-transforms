import program from 'commander';
import fs from 'fs';
import path from 'path';
import logger from './../utils/logger.util';
import {
  loadCollectionGroupFromFilepath,
  CollectionGroup,
  CollectionPipeline,
} from './../utils/collection-pipeline.util';

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

  logger.info('Pipeline', label, 'in', pipeline.dirname, JSON.stringify(pipeline, null, 2));
  logger.newline();
  logger.info('Includes', pipeline.includes.length, pipeline.includes);
  logger.newline();
  logger.info('Explicit Includes', pipeline.explicitIncludes.length, pipeline.explicitIncludes);
  logger.newline();
  logger.info('Excludes', pipeline.explicitIncludes.length, pipeline.excludes);
  logger.newline();
  logger.info('Merged Members', pipeline.members.size, pipeline.members);
};
