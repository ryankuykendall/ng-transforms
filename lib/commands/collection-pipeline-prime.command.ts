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
  getPipelinesByLabelFromGroup,
} from './../utils/collection-pipeline.util';
import { Filepath } from './../interfaces/collection-pipeline.interface';
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
    logger.newline();
    logger.info('Priming pipeline labeled', label);
    const directories: Filepath[] = pipeline.directoriesForPriming();

    directories.forEach(directory => {
      process.chdir(directory);
      // TODO (ryan): Update this to use execSync.
      exec("find . -name '*.ts' -exec echo {} \\; -exec touch {} \\;", (error, stdout, stderr) => {
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
  });
};
