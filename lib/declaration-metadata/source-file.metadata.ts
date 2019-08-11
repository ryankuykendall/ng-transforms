import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import { ISourceFileMetadata } from './source-file.interface';
import { IImportDeclarationMetadata, ModuleResolution } from './import-declaration.interface';
import { stripQuotes } from '../utils/string-literal.util';

const TYPESCRIPT_FILE_EXTENSION = 'ts';

export const collectSourceFileMetadata = (
  node: ts.SourceFile,
  filepath: string
): ISourceFileMetadata => {
  const importDeclarations: IImportDeclarationMetadata[] = node.statements
    .filter((statement: ts.Node) => ts.isImportDeclaration(statement))
    .map((statement: ts.Node) => statement as ts.ImportDeclaration)
    .map((statement: ts.ImportDeclaration) =>
      collectImportDeclarationMetadata(statement, filepath)
    );

  return {
    filepath,
    importDeclarations,
  };
};

const collectImportDeclarationMetadata = (
  node: ts.ImportDeclaration,
  moduleFilepath: string
): IImportDeclarationMetadata => {
  const moduleSpecifier = stripQuotes(node.moduleSpecifier);
  let moduleResolution = ModuleResolution.RelativeFilepath;
  let filepath: string | undefined;
  let nodeModule: string | undefined;
  const moduleSpecifierResolvedFilepath = path.resolve(
    path.join(path.dirname(moduleFilepath), `${moduleSpecifier}.${TYPESCRIPT_FILE_EXTENSION}`)
  );
  if (fs.existsSync(moduleSpecifierResolvedFilepath)) {
    filepath = moduleSpecifierResolvedFilepath;
  } else {
    moduleResolution = ModuleResolution.NodeModules;
    nodeModule = moduleSpecifier;
  }

  return {
    raw: node.getText(),
    moduleSpecifier,
    moduleResolution,
    filepath,
    nodeModule,
  };
};
