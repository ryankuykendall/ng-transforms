import ts from 'typescript';
import program from 'commander';
import fs from 'fs';
import path from 'path';
import * as fileutil from './../utils/file.util';
import logger from './../utils/logger.util';
import {
  CollectionGroup,
  CollectionPipeline,
  loadCollectionGroupFromFilepath,
  getPipelinesByLabelFromGroup,
} from './../utils/collection-pipeline.util';
import {
  IRootMetadata,
  collectMetadata,
  rootCollectorCallback,
} from './../declaration-metadata/index.metadata';
import { getRootMetadataStub } from '../declaration-metadata/root.metadata';
import { tsquery } from '@phenomnomnominal/tsquery';

// QUESTION (ryan): Would users want the ability to merge pipelines into a single result?

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

  const dirname = path.dirname(filepath);
  const outDirname = path.resolve(path.join(dirname, group.outDir));
  if (!fs.existsSync(outDirname)) {
    logger.info('Creating output directory', outDirname);
    fs.mkdirSync(outDirname);
  }

  logger.memory('Memory check before processing pipelines');

  pipelines.forEach((pipeline: CollectionPipeline) => {
    const { label, members } = pipeline;
    logger.newline();
    logger.info('Processing pipeline', label, 'with', members.size, 'members');
    logger.memory('Memory check before processing pipeline', label);

    // TODO (ryan): Next step, run pre commands if they exist!

    const metadata: IRootMetadata = getRootMetadataStub();
    Array.from(members)
      .map((filepath: string): [string, ts.SourceFile] => {
        const source: string = fs.readFileSync(filepath, fileutil.UTF8);
        return [filepath, tsquery.ast(source, filepath)];
      })
      .forEach(([filepath, ast]) => {
        ts.transform(ast, [collectMetadata(metadata, filepath, rootCollectorCallback)]);
      });

    logger.memory('Memory check before stringifying metadata for', label);

    const metadataOutput = JSON.stringify(metadata, null, 2);
    const outputFilepath = path.join(outDirname, `${label}.metadata.json`);
    fs.writeFileSync(outputFilepath, metadataOutput);
    logger.success(`Writing ${label} pipeline metadata to`, outputFilepath);

    // TODO (ryan): Next step, run post commands!
  });
};
