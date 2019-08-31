import program from 'commander';
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import * as fileutil from '../utils/file.util';
import { IConfig } from '../interfaces/collection-pipeline.interface';
import logger from '../utils/logger.util';
import { generateCollectionPipelineStub } from '../utils/collection-pipeline.util';

export const action = (cmd: program.Command) => {
  const outputFilepath: string | undefined = cmd.opts()['output']
    ? path.resolve(cmd.opts()['output'])
    : undefined;
  const config: IConfig = generateCollectionPipelineStub();

  if (outputFilepath) {
    fs.writeFileSync(outputFilepath, JSON.stringify(config, null, 2));
    logger.success(`Wrote project config file to`, outputFilepath);
  } else {
    console.log(JSON.stringify(config, null, 2));
  }
};
