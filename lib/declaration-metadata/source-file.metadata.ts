import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import { ISourceFileMetadata, IExportStatement } from './source-file.interface';
import {
  IImportDeclarationMetadata,
  ModuleResolution,
  INamedBinding,
  INamespaceBinding,
  INamespaceImport,
} from './import-declaration.interface';
import { stripQuotes } from '../utils/string-literal.util';
import { StatementType, DEFAULT_MODULE_EXPORT_IDENTIFIER } from './base.metadata';

const TYPESCRIPT_FILE_EXTENSION = 'ts';

export const collectSourceFileMetadata = (
  node: ts.SourceFile,
  filepath: string
): ISourceFileMetadata => {
  // TODO (ryan): Moving filtering out of this method. Distribute?
  const importDeclarations: IImportDeclarationMetadata[] = node.statements
    .filter((statement: ts.Node) => ts.isImportDeclaration(statement))
    .map((statement: ts.Node) => statement as ts.ImportDeclaration)
    .map((statement: ts.ImportDeclaration) =>
      collectImportDeclarationMetadata(statement, filepath)
    );

  // TODO (ryan): Moving filtering out of this method. Distribute?
  const exportStatements: IExportStatement[] = node.statements
    .filter((statement: ts.Node) => {
      return (
        statement.modifiers &&
        statement.modifiers.some((mod: ts.Modifier) => mod.kind === ts.SyntaxKind.ExportKeyword)
      );
    })
    .map(collectExportStatementsMetadata);

  return {
    filepath,
    importDeclarations,
    exportStatements,
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
  const namedBindings: INamedBinding[] = collectNamedBindingsMetadata(node);
  const namespaceBinding: INamespaceBinding | undefined = collectNamespaceBindingMetadata(node);
  const namespaceImport: INamespaceImport | undefined = collectNamespaceImportMetadata(node);

  return {
    moduleSpecifier,
    moduleResolution,
    filepath,
    nodeModule,
    namedBindings,
    namespaceBinding,
    namespaceImport,
  };
};

const collectExportStatementsMetadata = (statement: ts.Node): IExportStatement => {
  let identifier: string = '[unknown]';
  // Should this be an enum? DataType?
  let exportType = ts.SyntaxKind[statement.kind];
  let raw: string | undefined;

  switch (statement.kind) {
    case ts.SyntaxKind.EnumDeclaration:
      identifier = getEnumDeclarationIdentifier(statement as ts.EnumDeclaration);
      exportType = StatementType.Enum;
      break;
    case ts.SyntaxKind.ClassDeclaration:
      identifier = getClassDeclarationIdentifier(statement as ts.ClassDeclaration);
      exportType = StatementType.Class;
      break;
    case ts.SyntaxKind.FunctionDeclaration:
      identifier = getFunctionDeclarationIdentifier(statement as ts.FunctionDeclaration);
      exportType = StatementType.Function;
      break;
    case ts.SyntaxKind.InterfaceDeclaration:
      identifier = getInterfaceDeclarationIdentifier(statement as ts.InterfaceDeclaration);
      exportType = StatementType.Interface;
      break;
    case ts.SyntaxKind.TypeAliasDeclaration:
      identifier = getTypeAliasDeclarationIdentifier(statement as ts.TypeAliasDeclaration);
      exportType = StatementType.TypeAlias;
      break;
    case ts.SyntaxKind.VariableStatement:
      // TODO (ryan): Fix this by removing join!...Variable statements can have multiple declarations.
      identifier = getVariableStatementIdentifier(statement as ts.VariableStatement).join(', ');
      exportType = StatementType.Variable;
      break;
    default:
      raw = statement.getText().substring(0, 80);
      break;
  }

  return {
    identifier,
    exportType,
    raw,
  };
};

const collectNamedBindingsMetadata = (declaration: ts.ImportDeclaration): INamedBinding[] => {
  const bindings: INamedBinding[] = [];

  if (declaration.importClause) {
    const { namedBindings } = declaration.importClause;
    if (namedBindings) {
      switch (namedBindings.kind) {
        case ts.SyntaxKind.NamedImports:
          namedBindings.elements.forEach((element: ts.ImportSpecifier) => {
            const propertyIdentifier = element.propertyName && element.propertyName.getText();
            bindings.push({
              identifier: element.name.getText(),
              propertyIdentifier,
            });
          });
          break;
      }
    }
  } else {
    bindings.push({
      identifier: `[MISSING ImportClause] ${declaration.getText()}`,
    });
  }

  return bindings;
};

const collectNamespaceBindingMetadata = (
  declaration: ts.ImportDeclaration
): INamespaceBinding | undefined => {
  if (declaration.importClause && declaration.importClause.name) {
    return {
      identifier: declaration.importClause.name.getText(),
    };
  }
  return;
};

const collectNamespaceImportMetadata = (
  declaration: ts.ImportDeclaration
): INamespaceImport | undefined => {
  if (
    declaration.importClause &&
    declaration.importClause.namedBindings &&
    ts.isNamespaceImport(declaration.importClause.namedBindings)
  ) {
    const identifier = declaration.importClause.namedBindings.name.getText();
    return {
      identifier,
    };
  }
  return;
};

// TODO (ryan): Consolidate these into a reusable method.
const getClassDeclarationIdentifier = (statement: ts.ClassDeclaration): string => {
  if (statement.name) {
    return statement.name.getText();
  }

  if (
    statement.modifiers &&
    statement.modifiers.some((mod: ts.Modifier) => mod.kind == ts.SyntaxKind.DefaultKeyword)
  ) {
    return DEFAULT_MODULE_EXPORT_IDENTIFIER;
  }

  return '[anonymous]';
};

const getEnumDeclarationIdentifier = (statement: ts.EnumDeclaration): string => {
  if (statement.name) {
    return statement.name.getText();
  }

  return '[anonymous]';
};

const getFunctionDeclarationIdentifier = (statement: ts.FunctionDeclaration): string => {
  if (statement.name) {
    return statement.name.getText();
  }

  if (
    statement.modifiers &&
    statement.modifiers.some((mod: ts.Modifier) => mod.kind == ts.SyntaxKind.DefaultKeyword)
  ) {
    return DEFAULT_MODULE_EXPORT_IDENTIFIER;
  }

  return '[anonymous]';
};

const getInterfaceDeclarationIdentifier = (statement: ts.InterfaceDeclaration): string => {
  if (statement.name) {
    return statement.name.getText();
  }

  return '[anonymous]';
};

const getTypeAliasDeclarationIdentifier = (statement: ts.TypeAliasDeclaration): string => {
  if (statement.name) {
    return statement.name.getText();
  }

  return '[anonymous]';
};

const getVariableStatementIdentifier = (statement: ts.VariableStatement): string[] => {
  return statement.declarationList.declarations.map(
    (declaration: ts.VariableDeclaration): string => {
      return declaration.name.getText();
    }
  );
};
