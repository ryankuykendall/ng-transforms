import program from 'commander';
import fs from 'fs';
import logger from '../utils/logger.util';
import * as fileutil from '../utils/file.util';
import { ICollectionGroup, IPipeline } from '../interfaces/collection-pipeline.interface';

export const action = (
  filepath: string,
  srcLabel: string,
  destLabel: string,
  cmd: program.Command
) => {
  if (!fs.existsSync(filepath)) {
    logger.error('Collection pipelines file does note exist', filepath);
    return 0;
  }

  const group: ICollectionGroup = fileutil.loadJSONFile(filepath);
  const pipeline: IPipeline | undefined = group.pipelines.find(
    (pipeline: IPipeline) => pipeline.label === srcLabel
  );
  if (!pipeline) {
    logger.error('No pipeline exists with label', srcLabel);
    return 0;
  }
  const existingClonePipeline: IPipeline | undefined = group.pipelines.find(
    (pipeline: IPipeline) => pipeline.label === destLabel
  );
  if (existingClonePipeline) {
    logger.error(`A pipeline labeled ${destLabel} already exists`);
    return 0;
  }

  const clone: IPipeline = JSON.parse(JSON.stringify(pipeline));
  clone.label = destLabel;
  group.pipelines.push(clone);
  fs.writeFileSync(filepath, JSON.stringify(group, null, 2));
  logger.success(`Cloned ${srcLabel} pipeline to ${destLabel} pipeline in`, filepath);
};
