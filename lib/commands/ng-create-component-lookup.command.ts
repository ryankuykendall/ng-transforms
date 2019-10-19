import program from 'commander';
import fs from 'fs';
import * as fileUtil from './../utils/file.util';
import path from 'path';
import logger from './../utils/logger.util';
import { IRootMetadata } from '../declaration-metadata/root.interface';
import { IDirectiveMetadata, ISelectorSet } from '../declaration-metadata/directive.interface';
import { IComponentMetadata } from '../declaration-metadata/component.interface';
import {
  ILookupItem,
  LookupItemType,
  ILookupSummaryRoot,
  Selector,
} from './ng-create-component-lookup.interface';

// TODO (ryan):
//   1. Update all commands to follow this pattern for flags
//   2. Update command generator options in index.ts to use these as well
enum CommandOptions {
  OutputFilepath = 'output',
  RelativeFilepathRoot = 'relative',
  LightOutputMode = 'light',
}

export const action = (filepath: string, cmd: program.Command) => {
  const resolvedFilepath: string = path.resolve(filepath);
  const outputFilepath: string | null = cmd.opts()[CommandOptions.OutputFilepath]
    ? path.resolve(cmd.opts()[CommandOptions.OutputFilepath])
    : null;
  const relativeFilepathRoot = cmd.opts()[CommandOptions.RelativeFilepathRoot]
    ? path.resolve(cmd.opts()[CommandOptions.RelativeFilepathRoot])
    : null;
  const lightOutput: boolean = cmd.opts()[CommandOptions.LightOutputMode]
    ? cmd.opts()[CommandOptions.LightOutputMode]
    : false;

  if (!fs.existsSync(resolvedFilepath)) {
    logger.error(`Cannot locate metadata file @`, filepath, resolvedFilepath);
    process.exit(0);
  } else {
    const metadata: IRootMetadata = fileUtil.loadJSONFile(resolvedFilepath);
    const lookupItems: ILookupItem[] = [
      ...metadata.directives.map(
        (directive: IDirectiveMetadata): ILookupItem => {
          return {
            type: LookupItemType.Directive,
            filepath: directive.filepath,
            identifier: directive.identifier,
            selector: directive.selector,
          };
        }
      ),
      ...metadata.components.map(
        (component: IComponentMetadata): ILookupItem => {
          return {
            type: LookupItemType.Component,
            filepath: component.filepath,
            identifier: component.identifier,
            selector: component.selector,
          };
        }
      ),
    ].filter(({ selector }) => {
      return selector && selector.selectors && selector.selectors.length > 0;
    });

    // logger.info('Lookup items', '\n', JSON.stringify(lookupItems, null, 2));

    const tagNamePrefixes: Set<string> = new Set<string>();
    const selectorItemTypes: Set<string> = new Set();
    const lookupMap: ILookupSummaryRoot = {
      tagNamePrefixes: [],
    };

    lookupItems.forEach((lookupItem: ILookupItem) => {
      const { type: itemType, filepath, identifier, selector } = lookupItem;
      let relativeFilepath = filepath;
      if (relativeFilepathRoot) {
        relativeFilepath = path.relative(relativeFilepathRoot, filepath);
      }

      selector.selectors.forEach((selectorItems: Selector[]) => {
        selectorItems.forEach((item: Selector) => {
          let selectorType = item.type as string;
          let selectorAction = '[UNKNOWN_ACTION]';
          let selectorName = '[UNKNOWN_NAME]';
          switch (item.type) {
            case 'attribute':
              selectorAction = item.action;
              selectorName = item.name;
              break;
            case 'pseudo':
            case 'pseudo-element':
            case 'tag':
              // Upper case tagNames to match output of DOM Element.tagName.
              selectorName = item.name.toUpperCase();
              const tagNameComponents = selectorName.split('-');
              if (tagNameComponents.length > 1) {
                const [prefix] = tagNameComponents;
                tagNamePrefixes.add(prefix);
              }
            default:
              break;
          }
          selectorItemTypes.add(selectorType);

          if (!lookupMap.hasOwnProperty(selectorType)) {
            lookupMap[selectorType] = {};
          }

          if (!lookupMap[selectorType].hasOwnProperty(selectorName)) {
            lookupMap[selectorType][selectorName] = [];
          }

          let lookupItemCopy = Object.assign({}, lookupItem);
          if (lightOutput) {
            lookupItemCopy = Object.assign({}, lookupItemCopy, {
              selector: {
                raw: lookupItemCopy.selector.raw,
                selectors: undefined,
              },
            });
          }

          lookupMap[selectorType][selectorName].push({
            ...lookupItemCopy,
            filepath: relativeFilepath,
            primary: item,
          });
        });
      });
    });

    logger.info('Selector types', Array.from(selectorItemTypes));
    lookupMap.tagNamePrefixes = Array.from(tagNamePrefixes).sort();
    logger.info('tagNamePrefixes', lookupMap.tagNamePrefixes);

    const jsonOutput = JSON.stringify(lookupMap, null, 2);
    if (outputFilepath) {
      logger.info('Writing lookup to file', outputFilepath);
      fs.writeFileSync(outputFilepath, jsonOutput);
    } else {
      logger.info('Lookup Map', '\n', jsonOutput);
    }
  }
};
