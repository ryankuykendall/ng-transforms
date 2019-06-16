import ts from 'typescript';
import * as idUtil from './../utils/identifier.util';
import { IDirectiveMetadata } from './directive.interface';

export const collectDirectiveMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IDirectiveMetadata => {
  const identifier = idUtil.getName(node as idUtil.NameableProxy);
  return {
    identifier,
    filepath,
  };
};
