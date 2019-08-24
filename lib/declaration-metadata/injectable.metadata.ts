import ts from 'typescript';
import { IInjectableMetadata, IInjectableClassDecoratorMetadata } from './injectable.interface';
import { collectClassMetadata } from './class.metadata';
import { getDecoratorMap } from '../utils/decorator.util';
import { NgClassDecorator } from '../utils/decorator-identifier.util';
import { collectInjectableClassDecoratorMetadata } from './injectable-decorator.metadata';

export const collectInjectableMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IInjectableMetadata => {
  const classMetadata = collectClassMetadata(node, filepath);
  const classDecoratorMap = getDecoratorMap(node);
  const decorator = classDecoratorMap.get(NgClassDecorator.Injectable);
  const injectableDecoratorMetadata:
    | IInjectableClassDecoratorMetadata
    | undefined = collectInjectableClassDecoratorMetadata(decorator);

  return {
    ...injectableDecoratorMetadata,
    ...classMetadata,
  };
};
