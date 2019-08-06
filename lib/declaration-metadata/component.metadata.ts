import ts from 'typescript';
import { IComponentMetadata } from './component.interface';
import {
  collectClassMetadata,
  getMemberDistributionWithIdentifiersAndGroups,
} from './class.metadata';
import { NgClassDecorator } from './../utils/decorator-identifier.util';
import { collectDirectiveClassDecoratorMetadataFor } from './directive.metadata';
import { collectComponentClassDecoratorMetadata } from './component-decorator.metadata';
import { IAngularCoreClassMemberMetadata } from './angular-core.interface';
import {
  collectAngularCoreClassMemberMetadata,
  collectConstructorParameterMetadata,
} from './angular-core.metadata';

// TODO (ryan): Angular Components are a subclass of Directive Behavior.
//  Should a good deal of this be moved to the directive.metadata file?
//  Or should it be shared?

/**
 * TODOs (ryan):
 *   1. Make sure to capture the templateUrl filename, and styleUrls filenames; make sure to include it as a resolved path.
 *   2. Add metadata for identifying .scss as a dependency
 *   3. Capture the template & css contents itself too?
 *   4. Inspect component template to identify slots.
 *   5. Capture SCSS vars and transform them to CSS vars?
 **/

export const collectComponentMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IComponentMetadata => {
  const directiveDecoratorMetadata = collectDirectiveClassDecoratorMetadataFor(
    node,
    NgClassDecorator.Component
  );

  const componentDecoratorMetadata = collectComponentClassDecoratorMetadata(node);

  const classMetadata = collectClassMetadata(node, filepath);
  const distribution = getMemberDistributionWithIdentifiersAndGroups(node);
  const constructorParameterMetadata = collectConstructorParameterMetadata(
    distribution,
    classMetadata
  );
  const angularCoreClassMemberMetadata: IAngularCoreClassMemberMetadata = collectAngularCoreClassMemberMetadata(
    distribution
  );

  // Continue building out component specific metadata

  return {
    // Decorators
    ...directiveDecoratorMetadata,
    ...componentDecoratorMetadata,
    // Class Members
    ...classMetadata,
    constructorParameterMetadata,
    ...angularCoreClassMemberMetadata,

    // Placeholder for template
    ngTemplate: [],
  };
};
