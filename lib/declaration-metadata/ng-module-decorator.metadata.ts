import ts from 'typescript';
import { Property as NgModuleDecoratorProperty } from './ng-module-decorator.property';
import { INgModuleClassDecoratorMetadata } from './ng-module.interface';

export const collectNgModuleDecoratorMetadata = (
  node: ts.Node
): INgModuleClassDecoratorMetadata => {
  return {};
};
