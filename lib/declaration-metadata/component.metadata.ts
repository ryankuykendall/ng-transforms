import ts from 'typescript';
import * as idUtil from './../utils/identifier.util';
import { IComponentMetadata } from './component.interface';

export const collectComponentMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IComponentMetadata => {
  const identifier = idUtil.getName(node as idUtil.NameableProxy);
  return {
    identifier,
    filepath,
  };
};
