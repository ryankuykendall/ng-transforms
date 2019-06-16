import ts from 'typescript';
import * as idUtil from './../utils/identifier.util';
import { IClassMetadata } from './class.interface';

export const collectClassMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IClassMetadata => {
  const identifier = idUtil.getName(node as idUtil.NameableProxy);
  return {
    identifier,
    filepath,
  };
};
