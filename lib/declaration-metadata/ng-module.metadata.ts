import ts from 'typescript';
import * as idUtil from './../utils/identifier.util';
import { INgModuleMetadata } from './ng-module.interface';

export const collectNgModuleMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): INgModuleMetadata => {
  const identifier = idUtil.getName(node as idUtil.NameableProxy);
  return {
    identifier,
    filepath,
  };
};
