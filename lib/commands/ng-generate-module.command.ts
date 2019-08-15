import program from 'commander';
import ts from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';
import logger from '../utils/logger.util';

import fs from 'fs';
import * as fileUtil from './../utils/file.util';
import path from 'path';
import { IRootMetadata, RootType } from '../declaration-metadata/root.interface';
import { IHasIdentifier, IHasFilepath } from '../declaration-metadata/base.interface';
import * as gmTransform from '../transforms/ng-module/generate.transform';
import { INgModuleMetadata } from '../declaration-metadata/ng-module.interface';
import { IComponentClassDecoratorMetadata } from '../declaration-metadata/component.interface';
import { IDirectiveMetadata } from '../declaration-metadata/directive.interface';

const DEFAULT_MODULE_STUB_FILEPATH = 'stubs/modules/ng-module-basic.module.ts';

interface IImportGroupItem extends IHasIdentifier, IHasFilepath {}

export const action = (filepath: string, cmd: program.Command) => {
  const metadataFilepath = path.resolve(filepath);
  if (!fs.existsSync(metadataFilepath)) {
    logger.error('ng metadata file does not exist', metadataFilepath);
    return 0;
  }

  // TODO (ryan): Fix this! This is very brittle...
  const moduleStubFilepath = path.resolve(
    path.join(process.cwd(), cmd.opts()['module-stub-filepath'] || DEFAULT_MODULE_STUB_FILEPATH)
  );
  if (!fs.existsSync(moduleStubFilepath)) {
    logger.error('Cannot locate module stub file', moduleStubFilepath);
  }
  const moduleSource = fs.readFileSync(moduleStubFilepath, fileUtil.UTF8);
  const moduleAst = tsquery.ast(moduleSource);

  const outputFilepath = cmd.opts()['output'] ? path.resolve(cmd.opts()['output']) : null;
  const relativeRootFilepath = cmd.opts()['relative']
    ? path.resolve(path.join(__dirname, cmd.opts()['output']))
    : null;
  const importModules: boolean = cmd.opts()['import-modules'] || false;
  const importDirectives: boolean = cmd.opts()['import-directives'] || false;
  const importComponents: boolean = cmd.opts()['import-components'] || false;
  const importAll: boolean = cmd.opts()['import-all'] || false;

  const metadataRaw = fs.readFileSync(metadataFilepath, fileUtil.UTF8);
  const metadata: IRootMetadata = JSON.parse(metadataRaw);

  const importDeclarationItems: IImportGroupItem[] = [];
  const rootItemsToCollect = new Set<RootType>();
  if (importAll) {
    rootItemsToCollect.add(RootType.NgModules);
    rootItemsToCollect.add(RootType.Components);
    rootItemsToCollect.add(RootType.Directives);
  }
  if (importModules) {
    rootItemsToCollect.add(RootType.NgModules);
  }
  if (importDirectives) {
    rootItemsToCollect.add(RootType.Directives);
  }
  if (importComponents) {
    rootItemsToCollect.add(RootType.Classes);
  }

  const identifiersByFile = new Map<string, Set<string>>() as gmTransform.IdentifiersByFile;
  Array.from(rootItemsToCollect).forEach((rootType: RootType) => {
    if (metadata[rootType]) {
      metadata[rootType].forEach(({ filepath: itemFilepath, identifier }: any) => {
        let relative = path.dirname(itemFilepath);
        if (relativeRootFilepath) {
          relative = path.relative(relativeRootFilepath, relative);
        }

        if (!identifiersByFile.has(relative)) {
          identifiersByFile.set(relative, new Set<string>());
        }

        const identifiersInFile = identifiersByFile.get(relative);
        if (identifiersInFile) {
          identifiersInFile.add(identifier);
        }
      });
    }
  });

  logger.info(
    'identifiersByFile',
    Array.from(identifiersByFile.entries()).map(([file, ids]) => {
      return [file, Array.from(ids)];
    })
  );

  const transformation: ts.TransformationResult<ts.SourceFile> = gmTransform.invoke(
    moduleAst,
    identifiersByFile
  );

  logger.info('Transformation result', '\n', transformation.transformed[0].getFullText());
};
