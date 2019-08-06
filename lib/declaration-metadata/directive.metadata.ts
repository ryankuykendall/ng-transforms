import ts from 'typescript';
import { IDirectiveMetadata, IDirectiveClassDecoratorMetadata } from './directive.interface';
import {
  collectClassMetadata,
  getMemberDistributionWithIdentifiersAndGroups,
} from './class.metadata';
import { IClassMetadata } from './class.interface';
import { getDecoratorMap } from '../utils/decorator.util';
import { NgClassDecorator } from '../utils/decorator-identifier.util';
import { collectDirectiveDecoratorMetadata } from './directive-decorator.metadata';
import { IAngularCoreClassMemberMetadata } from './angular-core.interface';
import {
  collectConstructorParameterMetadata,
  collectAngularCoreClassMemberMetadata,
} from './angular-core.metadata';

export const collectDirectiveMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IDirectiveMetadata => {
  const directiveDecoratorMetadata = collectDirectiveClassDecoratorMetadataFor(
    node,
    NgClassDecorator.Directive
  );
  const classMetadata: IClassMetadata = collectClassMetadata(node, filepath);
  const distribution = getMemberDistributionWithIdentifiersAndGroups(node);
  const constructorParameterMetadata = collectConstructorParameterMetadata(
    distribution,
    classMetadata
  );
  const angularCoreClassMemberMetadata: IAngularCoreClassMemberMetadata = collectAngularCoreClassMemberMetadata(
    distribution
  );

  return {
    ...(directiveDecoratorMetadata as IDirectiveClassDecoratorMetadata),
    ...classMetadata,
    // Class Member
    constructorParameterMetadata,
    ...angularCoreClassMemberMetadata,
    // NOTE (ryan): ngTemplate to be created in post processing
    //   step.
    ngTemplate: [],
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
