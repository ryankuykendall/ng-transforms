import program from 'commander';
import fs from 'fs';
import path from 'path';
import * as fileutil from './../utils/file.util';
import logger from './../utils/logger.util';
import { IRootMetadata } from './../declaration-metadata/root.interface';
import { IComponentMetadata } from './../declaration-metadata/component.interface';
import { DEFAULT_OUT_DIR } from './../utils/collection-pipeline.util';
import { CssSelector } from '@angular/compiler';
import {
  IContentChildMemberMetadata,
  IContentChildrenMemberMetadata,
} from '../declaration-metadata/angular-core.interface';
import { IType } from '../declaration-metadata/type.interface';

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
  const { components, directives } = metadata;
  const identifierMap: Map<string, IComponentMetadata> = [...components, ...directives].reduce(
    (collection, component: IComponentMetadata) => {
      collection.set(component.identifier, component);
      return collection;
    },
    new Map<string, IComponentMetadata>()
  );
  // console.log(`Identifiers`, Array.from(identifierMap.keys()));
  components.forEach((component: IComponentMetadata) => {
    const { filepath: componentFilepath, selector, identifier } = component;
    const parsedCssSelectors: CssSelector[] = CssSelector.parse(selector.raw);
    parsedCssSelectors.forEach((css: CssSelector, index: number) => {
      logger.info(`${index}. Tag output for`, identifier, 'is', css.getMatchingElementTemplate());
      const contentChildContents: string[] = generateContentChildContents(
        component.contentChildMembers,
        identifierMap
      );
      const contentChildrenContents: string[] = generateContentChildrenContents(
        component.contentChildrenMembers,
        identifierMap
      );

      logger.info(` - content child contents:`, contentChildContents || 'n/a');
      logger.info(` - content children contents:`, contentChildrenContents || 'n/a');
    });
  });
};

const generateContentChildContents = (
  members: IContentChildMemberMetadata[] | undefined,
  lookup: Map<string, IComponentMetadata>
): string[] => {
  const contents: string[] = [];
  if (members) {
    members.forEach((member: IContentChildMemberMetadata) => {
      const identifier = (member.selector as IType).type;
      const component = lookup.get(identifier);
      if (component) {
        const { selector, identifier } = component;
        const parsedCssSelectors: CssSelector[] = CssSelector.parse(selector.raw);
        parsedCssSelectors.forEach((css: CssSelector, index: number) => {
          logger.info(
            ` - ${index}. Tag output for content child`,
            identifier,
            'is',
            css.getMatchingElementTemplate()
          );

          contents.push(css.getMatchingElementTemplate());
        });
      }
    });
  }

  return contents;
};

const generateContentChildrenContents = (
  members: IContentChildrenMemberMetadata[] | undefined,
  lookup: Map<string, IComponentMetadata>
): string[] => {
  const contents: string[] = [];
  if (members) {
    members.forEach((member: IContentChildrenMemberMetadata) => {
      const identifier = (member.selector as IType).type;
      const component = lookup.get(identifier);
      if (component) {
        const { selector, identifier } = component;
        const parsedCssSelectors: CssSelector[] = CssSelector.parse(selector.raw);
        parsedCssSelectors.forEach((css: CssSelector, index: number) => {
          logger.info(
            ` - ${index}. Tag output for content children`,
            identifier,
            'is',
            css.getMatchingElementTemplate()
          );

          contents.push(css.getMatchingElementTemplate());
        });
      }
    });
  }

  return contents;
};
