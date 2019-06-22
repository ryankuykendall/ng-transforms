import ts from 'typescript';
import * as idUtil from './../utils/identifier.util';
import { ITypeAliasMetadata } from './type-aliases.interface';
import { getTypeCompositionFromNode } from './type.metadata';

export const collectTypeAliasMetadata = (
  node: ts.TypeAliasDeclaration,
  filepath: string
): ITypeAliasMetadata => {
  const identifier = idUtil.getName(node as idUtil.NameableProxy);
  const typeComposition = getTypeCompositionFromNode(node.type);

  return {
    filepath,
    identifier,
    ...typeComposition,
  } as ITypeAliasMetadata;
};
