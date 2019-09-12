import program from 'commander';
import fs from 'fs';
import path from 'path';
import logger from './../utils/logger.util';
import * as fileutil from './../utils/file.util';
import { ICollectionGroup } from '../interfaces/collection-pipeline.interface';
import { generateCollectionPipelineStub } from '../utils/collection-pipeline.util';

export const action = (filepath: string, label: string, cmd: program.Command) => {
  if (!fs.existsSync(filepath)) {
    logger.error('Collection pipelines file does note exist', filepath);
    return 0;
  }

  const group: ICollectionGroup = fileutil.loadJSONFile(filepath);
  const pipelineLabels: Set<string> = new Set(group.pipelines.map(({ label }) => label));
  if (pipelineLabels.has(label)) {
    logger.error('A pipeline labeled ${label} already exists');
  }
  const pipeline = generateCollectionPipelineStub(label);
  group.pipelines.push(pipeline);
  fs.writeFileSync(filepath, JSON.stringify(group, null, 2));
  logger.success('Added new pipeline labeled ${label} to', filepath);
};
