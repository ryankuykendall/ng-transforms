import ts from 'typescript';
import { IDirectiveMetadata } from './directive.interface';
import { collectClassMetadata } from './class.metadata';

export const collectDirectiveMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IDirectiveMetadata => {
  const metadata = collectClassMetadata(node, filepath);
  // Continue collecting directive specific metadata
  return metadata;
};
