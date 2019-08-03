import ts from 'typescript';
import { INgModuleMetadata } from './ng-module.interface';
import { collectClassMetadata } from './class.metadata';
import { collectNgModuleDecoratorMetadata } from './ng-module-decorator.metadata';

export const collectNgModuleMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): INgModuleMetadata => {
  const classMetadata = collectClassMetadata(node, filepath);
  const ngModuleDecoratorMetadata = collectNgModuleDecoratorMetadata(node);

  return {
    ...classMetadata,
    ...ngModuleDecoratorMetadata,
  };
};
