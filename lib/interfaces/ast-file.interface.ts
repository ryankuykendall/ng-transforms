import ts from 'typescript';

export const TS_NODE_BASE_ATTRS = new Set([
  // from TextRange interface
  'pos',
  'end',
  // from Node interface
  'kind',
  'flags',
  'modifierFlagsCache',
  'parent',
  'transformFlags',
]);

export const TS_FILE_EXTNAME = '.ts';

export enum NgAstSelector {
  ComponentDecoratorContainingTemplateUrl = "ClassDeclaration Decorator:has(Identifier[name='Component']) PropertyAssignment:has(Identifier[name='templateUrl']) StringLiteral",
  ComponentDecoratorContainingStyleUrls = "ClassDeclaration Decorator:has(Identifier[name='Component']) PropertyAssignment:has(Identifier[name='styleUrls']) StringLiteral",
  // For the following, would still need to backtrack to ImportDeclaration
  NgImportComponentDecoratorFromCore = "ImportDeclaration:has(ImportClause:has(NamedImports ImportSpecifier Identifier[name='Component'])) StringLiteral[value=/@angular/][value=/core/]",
  NgInterfaces = 'ClassDeclaration, InterfaceDeclaration, EnumDeclaration, SourceFile > FunctionDeclaration, SourceFile > ArrowFunction, SourceFile > TypeAliasDeclaration',
  ComponentDecoratorOnClassDeclaration = "ClassDeclaration Decorator:has(Identifier[name='Component'])",
  ImportDeclarationWithTestInModuleSpecifier = 'ImportDeclaration[moduleSpecifier.text=/test/]',
  ComponentTemplateUrlTSQuery = "ClassDeclaration Decorator:has(CallExpression[expression.escapedText='Component']) PropertyAssignment[name.escapedText='templateUrl']",
  ComponentStyleUrlsTSQuery = "ClassDeclaration Decorator:has(CallExpression[expression.escapedText='Component']) PropertyAssignment[name.escapedText='styleUrls']",
}

export interface IFileAST {
  filepath: string;
  source: string;
  ast: ts.SourceFile; // TODO (ryan): Rename this to sourceFile!!!
  srcDirectory?: string;
  buildDirectory?: string;
  relativeDirname?: string;
}

export interface IFileASTQueryMatch extends IFileAST {
  matches: ts.Node[];
}

export interface IFileTransformationResult extends IFileAST {
  transformation: ts.TransformationResult<ts.SourceFile>;
}
