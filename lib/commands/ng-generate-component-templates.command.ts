import program from 'commander';
import fs from 'fs';
import path from 'path';
import * as fileutil from './../utils/file.util';
import logger from './../utils/logger.util';
import { IRootMetadata } from './../declaration-metadata/root.interface';
import { IComponentMetadata } from './../declaration-metadata/component.interface';
import { DEFAULT_OUT_DIR } from './../utils/collection-pipeline.util';
import { CssSelector } from '@angular/compiler';

const COMPONENT_TEMPLATES_DIRNAME = 'components';

export const action = (filepath: string, cmd: program.Command) => {
  if (!fs.existsSync(filepath)) {
    logger.error(`Unable to locate metadata file at`, filepath);
    return 0;
  }

  // QUESTION (ryan): Should we use the default out dir as the fallback or should we
  //   default to a directory relative to the metadata file?
  const outDirRoot: string = cmd.opts()['outDir'] || path.dirname(filepath);
  const componentDirname = path.join(outDirRoot, COMPONENT_TEMPLATES_DIRNAME);
  const mirror: boolean = cmd.opts()['mirror'] || false;

  const metadata: IRootMetadata = fileutil.loadJSONFile(filepath);
  const { components } = metadata;
  components.forEach((component: IComponentMetadata) => {
    const { filepath: componentFilepath, selector, identifier } = component;
    const parsedCssSelectors: CssSelector[] = CssSelector.parse(selector.raw);
    parsedCssSelectors.forEach((css: CssSelector) => {
      logger.info(`Tag output for`, identifier, 'is', css.getMatchingElementTemplate());
    });
  });
};
