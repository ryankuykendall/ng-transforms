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
import { generateTypescriptFromSourceFileAST } from '../utils/ast.util';

const DEFAULT_MODULE_STUB_FILEPATH = 'stubs/modules/ng-module-basic.module.ts';
const DEFAULT_MODULE_STUB_IDENTIFIER = 'NgModuleBasicClassName';

interface IImportGroupItem extends IHasIdentifier, IHasFilepath {}

export const action = (identifier: string, filepath: string, cmd: program.Command) => {
  const metadataFilepath = path.resolve(filepath);
  if (!fs.existsSync(metadataFilepath)) {
    logger.error('ng metadata file does not exist', metadataFilepath);
    return 0;
  }

  logger.info(`options`, cmd.opts());

  // TODO (ryan): Fix this! This is very brittle...
  //   Export default file via package.json...
  const moduleStubFilepath = path.resolve(
    path.join(process.cwd(), cmd.opts()['moduleStubFilepath'] || DEFAULT_MODULE_STUB_FILEPATH)
  );
  if (!fs.existsSync(moduleStubFilepath)) {
    logger.error('Cannot locate module stub file', moduleStubFilepath);
  }
  const moduleSource = fs.readFileSync(moduleStubFilepath, fileUtil.UTF8);
  const moduleAst = tsquery.ast(moduleSource);

  const outputFilepath = cmd.opts()['output'] ? path.resolve(cmd.opts()['output']) : null;
  const relativeRootFilepath = cmd.opts()['relative'] ? path.resolve(cmd.opts()['relative']) : null;
  const importModules: boolean = cmd.opts()['importModules'] || false;
  const importDirectives: boolean = cmd.opts()['importDirectives'] || false;
  const importComponents: boolean = cmd.opts()['importComponents'] || false;
  const importAll: boolean = cmd.opts()['importAll'] || false;

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

  logger.info(`Collecting`, Array.from(rootItemsToCollect));

  const identifiersByFile = new Map<string, Set<string>>() as gmTransform.IdentifiersByFile;
  Array.from(rootItemsToCollect).forEach((rootType: RootType) => {
    if (metadata[rootType]) {
      metadata[rootType].forEach(({ filepath: itemFilepath, identifier }: any) => {
        let relative = itemFilepath;
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
    } else {
      logger.error(`No metadata for RootType`, rootType);
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
    identifiersByFile,
    identifier,
    DEFAULT_MODULE_STUB_IDENTIFIER
  );

  const [sourceFileTransformed] = transformation.transformed;
  const generatedSource = generateTypescriptFromSourceFileAST(
    sourceFileTransformed,
    outputFilepath || 'generated-module.ts',
    true
  );

  if (outputFilepath) {
    logger.success(`Writing generated module for`, identifier, `to`, outputFilepath);
    fs.writeFileSync(outputFilepath, generatedSource);
  } else {
    logger.info('Transformation result for', identifier, '\n', generatedSource);
  }
};
