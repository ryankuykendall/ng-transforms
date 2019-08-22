import ts from 'typescript';
import { IServiceMetadata } from './service.interface';
import { collectClassMetadata } from './class.metadata';
import { getDecoratorMap } from '../utils/decorator.util';
import { NgClassDecorator } from '../utils/decorator-identifier.util';

export const collectInjectableMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IServiceMetadata => {
  const classMetadata = collectClassMetadata(node, filepath);
  const classDecoratorMap = getDecoratorMap(node);
  const decorator = classDecoratorMap.get(NgClassDecorator.Injectable);
  const injectableDecoratorMetadata = collectInjectableDecoratorMetadata(decorator);

  return {
    ...classMetadata,
    ...injectableDecoratorMetadata,
  };
};

// TODO (ryan): Complete this using IHasExpression
const collectInjectableDecoratorMetadata = (
  decorator: ts.Decorator | undefined
): { [key: string]: string } => {
  return {};
};
