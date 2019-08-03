import ts from 'typescript';
import { INgModuleMetadata } from './ng-module.interface';
import { collectClassMetadata } from './class.metadata';
import { collectNgModuleDecoratorMetadata } from './ng-module-decorator.metadata';
import { getDecoratorMap } from '../utils/decorator.util';
import { NgClassDecorator } from '../utils/decorator-identifier.util';

export const collectNgModuleMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): INgModuleMetadata => {
  const classMetadata = collectClassMetadata(node, filepath);
  const classDecoratorMap = getDecoratorMap(node);
  const decorator = classDecoratorMap.get(NgClassDecorator.NgModule);
  const ngModuleDecoratorMetadata = collectNgModuleDecoratorMetadata(decorator);

  return {
    ...classMetadata,
    ...ngModuleDecoratorMetadata,
  };
};
