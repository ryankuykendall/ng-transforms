import ts from 'typescript';
import { IComponentMetadata } from './component.interface';
import { collectClassMetadata } from './class.metadata';

export const collectComponentMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IComponentMetadata => {
  const metadata = collectClassMetadata(node, filepath);
  // Continue building out component specific metadata
  return metadata;
};
