import ts from 'typescript';
import { IDirectiveMetadata, IDirectiveClassDecoratorMetadata } from './directive.interface';
import { collectClassMetadata } from './class.metadata';
import { IClassMetadata } from './class.interface';
import { getDecoratorMap } from '../utils/decorator.util';
import { NgClassDecorator } from '../utils/decorator-identifier.util';
import { collectDirectiveDecoratorMetadata } from './directive-decorator.metadata';

export const collectDirectiveMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IDirectiveMetadata => {
  const classMetadata: IClassMetadata = collectClassMetadata(node, filepath);
  const directiveDecoratorMetadata = collectDirectiveClassDecoratorMetadataFor(
    node,
    NgClassDecorator.Directive
  );

  return {
    ...(directiveDecoratorMetadata as IDirectiveClassDecoratorMetadata),
    ...classMetadata,
    // NOTE (ryan): ngTemplate to be created in post processing
    //   step.
    ngTemplate: '',
  };
};

export const collectDirectiveClassDecoratorMetadataFor = (
  node: ts.ClassDeclaration,
  identifier: NgClassDecorator
): IDirectiveClassDecoratorMetadata => {
  const classDecoratorMap = getDecoratorMap(node);
  const decorator = classDecoratorMap.get(identifier);
  return collectDirectiveDecoratorMetadata(decorator);
};
