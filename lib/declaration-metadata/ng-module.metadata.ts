import ts from 'typescript';
import { INgModuleMetadata } from './ng-module.interface';
import { collectClassMetadata } from './class.metadata';

export const collectNgModuleMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): INgModuleMetadata => {
  const metadata = collectClassMetadata(node, filepath);
  return metadata;
};
