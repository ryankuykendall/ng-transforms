import program from 'commander';
import fs from 'fs';
import path from 'path';
import logger from './../utils/logger.util';
import {
  loadCollectionGroupFromFilepath,
  CollectionGroup,
  CollectionPipeline,
  getPipelinesByLabelFromGroup,
} from '../utils/collection-pipeline.util';
import { pipeline } from 'stream';

export const action = (filepath: string, cmd: program.Command) => {
  const label: string | undefined = cmd.opts()['label'];

  const groupFilepath = path.resolve(filepath);
  if (!fs.existsSync(groupFilepath)) {
    logger.error('Unable to load collection group', groupFilepath);
    return 0;
  }

  const group: CollectionGroup = loadCollectionGroupFromFilepath(groupFilepath);
  const pipelines: CollectionPipeline[] = !!label
    ? getPipelinesByLabelFromGroup(group, label)
    : group.pipelines;

  if (pipelines.length === 0) {
    if (label) {
      logger.error('No pipeline labeled', label, 'in group');
    } else {
      logger.error('No pipelines found in group');
    }
    return 0;
  }

  pipelines.forEach((pipeline: CollectionPipeline) => {
    const { label } = pipeline;
    logger.info('Pipeline', label, 'in', pipeline.dirname, JSON.stringify(pipeline, null, 2));
    logger.newline();
    logger.info('Includes', pipeline.includes.length, pipeline.includes);
    logger.newline();
    logger.info('Explicit Includes', pipeline.explicitIncludes.length, pipeline.explicitIncludes);
    logger.newline();
    logger.info('Excludes', pipeline.explicitIncludes.length, pipeline.excludes);
    logger.newline();
    logger.info('TSQuery Excludes', pipeline.tsqueryExcludes.length, pipeline.tsqueryExcludes);
    logger.newline();
    logger.info('Merged Members', pipeline.members.size, pipeline.members);
  });
};
