import program from 'commander';
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import * as fileutil from '../utils/file.util';
import { ICollectionGroup } from '../interfaces/collection-pipeline.interface';
import logger from '../utils/logger.util';
import {
  generateCollectionGroupStub,
  DEFAULT_OUT_DIR,
  DEFAULT_LABEL,
} from '../utils/collection-pipeline.util';
import { VERSION } from '../utils/package.util';

export const action = (cmd: program.Command) => {
  const outputFilepath: string | undefined = cmd.opts()['output']
    ? path.resolve(cmd.opts()['output'])
    : undefined;
  const outDir: string = cmd.opts()['outDir'] || DEFAULT_OUT_DIR;
  const label: string = cmd.opts()['label'] || DEFAULT_LABEL;
  const config: ICollectionGroup = generateCollectionGroupStub(VERSION, outDir, label);

  if (outputFilepath) {
    fs.writeFileSync(outputFilepath, JSON.stringify(config, null, 2));
    logger.success(`Collection Group file created and written to`, outputFilepath);
  } else {
    console.log(JSON.stringify(config, null, 2));
  }
};
