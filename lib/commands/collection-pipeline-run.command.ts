import program from 'commander';
import fs from 'fs';
import path from 'path';
import logger from './../utils/logger.util';
import {
  CollectionGroup,
  CollectionPipeline,
  loadCollectionGroupFromFilepath,
} from './../utils/collection-pipeline.util';

export const action = (filepath: string, cmd: program.Command) => {
  const label: string | undefined = cmd.opts()['label'];

  const groupFilepath = path.resolve(filepath);
  if (!fs.existsSync(groupFilepath)) {
    logger.error('Unable to load collection group', groupFilepath);
    return 0;
  }

  const group: CollectionGroup = loadCollectionGroupFromFilepath(groupFilepath);

  // TODO (ryan): Add the ability to process all pipelines
  let pipelines: CollectionPipeline[] = group.pipelines;
  if (label) {
    const pipeline: CollectionPipeline | undefined = group.getPipeline(label);
    if (pipeline) {
      pipelines = [pipeline];
    } else {
      logger.error('No pipeline labeled', label, 'in group');
      return 0;
    }
  }

  const dirname = path.dirname(filepath);
  const outDirname = path.resolve(path.join(dirname, group.outDir));
  if (!fs.existsSync(outDirname)) {
    logger.info('Creating output directory', outDirname);
    fs.mkdirSync(outDirname);
  }

  pipelines.forEach((pipeline: CollectionPipeline) => {
    const { label, members } = pipeline;
    logger.info('Processing pipeline', label, 'with', members.size, 'members');
  });
};
