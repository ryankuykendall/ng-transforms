import program from 'commander';
import fs from 'fs';
import * as fileUtil from './../utils/file.util';
import path from 'path';
import logger from './../utils/logger.util';
import { IRootMetadata } from '../declaration-metadata/root.interface';
import { IDirectiveMetadata, ISelectorSet } from '../declaration-metadata/directive.interface';
import { IComponentMetadata } from '../declaration-metadata/component.interface';
import { Selector } from 'css-what';

enum LookupItemType {
  Directive = 'directive',
  Component = 'component',
}

interface LookupItem {
  type: LookupItemType;
  filepath: string;
  identifier: string;
  selector: ISelectorSet;
}

interface LookupSummaryItem extends LookupItem {
  primary: Selector;
}

export const action = (filepath: string, cmd: program.Command) => {
  const resolvedFilepath: string = path.resolve(filepath);
  const outputFilepath = cmd.opts()['output'] || null;
  const relativeFilepathRoot = cmd.opts()['relative'] ? path.resolve(cmd.opts()['relative']) : null;

  if (!fs.existsSync(resolvedFilepath)) {
    logger.error(`Cannot locate metadata file @`, filepath, resolvedFilepath);
    process.exit(0);
  } else {
    const metadata: IRootMetadata = fileUtil.loadJSONFile(resolvedFilepath);
    const lookupItems: LookupItem[] = [
      ...metadata.directives.map(
        (directive: IDirectiveMetadata): LookupItem => {
          return {
            type: LookupItemType.Directive,
            filepath: directive.filepath,
            identifier: directive.identifier,
            selector: directive.selector,
          };
        }
      ),
      ...metadata.components.map(
        (component: IComponentMetadata): LookupItem => {
          return {
            type: LookupItemType.Component,
            filepath: component.filepath,
            identifier: component.identifier,
            selector: component.selector,
          };
        }
      ),
    ].filter(({ selector }) => selector.selectors.length > 0);

    console.log(JSON.stringify(lookupItems, null, 2));

    const selectorItemTypes: Set<string> = new Set();
    const lookupMap: { [key: string]: { [key: string]: LookupSummaryItem[] } } = {};

    lookupItems.forEach((lookupItem: LookupItem) => {
      const { type: itemType, filepath, identifier, selector } = lookupItem;
      let relativeFilepath = filepath;
      if (relativeFilepathRoot) {
        relativeFilepath = path.relative(relativeFilepathRoot, filepath);
      }
      logger.info('Item at relative filepath', identifier, relativeFilepath);

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
              selectorName = item.name;
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

          lookupMap[selectorType][selectorName].push({
            ...lookupItem,
            filepath: relativeFilepath,
            primary: item,
          });
        });
      });
    });

    console.log('selectorItemTypes', Array.from(selectorItemTypes));
    console.log('Lookup Map\n', JSON.stringify(lookupMap, null, 2));
  }
};
