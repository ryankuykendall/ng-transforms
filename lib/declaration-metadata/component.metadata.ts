import ts from 'typescript';
import {
  IComponentMetadata,
  IInputMemberMetadata,
  IHostBindingMemberMetadata,
  IOutputMemberMetadata,
} from './component.interface';
import {
  collectClassMetadata,
  getMemberDistributionWithIdentifiersAndGroups,
  IMember,
} from './class.metadata';
import * as decUtil from './../utils/decorator-identifier.util';

export const collectComponentMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IComponentMetadata => {
  const metadata = collectClassMetadata(node, filepath);
  const distribution = getMemberDistributionWithIdentifiersAndGroups(node);
  const inputMembers = collectInputMemberMetadata(distribution);
  const hostBindingMembers = collectHostBindingMemberMetadata(distribution);
  const outputMembers = collectOutputMemberMetadata(distribution);
  // Continue building out component specific metadata

  return {
    ...metadata,
    bootstrappingTemplate: '',
    inputMembers,
    hostBindingMembers,
    outputMembers,
  };
};

const collectInputMemberMetadata = (distribution: IMember[]): IInputMemberMetadata[] => {
  return distribution
    .filter((member: IMember) => member.decorators.has(decUtil.INPUT))
    .map(
      (member: IMember): IInputMemberMetadata => {
        const { identifier } = member;
        const decorator = member.decorators.get(decUtil.INPUT);
        let bindingPropertyName = undefined;
        if (decorator) {
          const bindingPropertyName = getBindingPropertyName(decorator);
        }
        return {
          identifier,
          in: member.in,
        } as IInputMemberMetadata;
      }
    );
};

const getBindingPropertyName = (decorator: ts.Decorator): string | undefined => {
  if (decorator.expression && (decorator.expression as ts.CallExpression).arguments) {
    const callExpArgs = (decorator.expression as ts.CallExpression).arguments;
    if (callExpArgs.length > 0) {
      return (callExpArgs[0] as ts.StringLiteral).getText();
    }
  }

  return;
};

// TODO (ryan): Finish this...check Angular API for CallExpression arguments
const collectHostBindingMemberMetadata = (
  distribution: IMember[]
): IHostBindingMemberMetadata[] => {
  return distribution
    .filter((member: IMember) => member.decorators.has(decUtil.HOST_BINDING))
    .map((member: IMember) => {
      const { identifier } = member;
      return {
        identifier,
        in: member.in,
      } as IHostBindingMemberMetadata;
    });
};

// TODO (ryan): Finish this...check Angular API for CallExpression arguments
const collectOutputMemberMetadata = (distribution: IMember[]): IOutputMemberMetadata[] => {
  return distribution
    .filter((member: IMember) => member.decorators.has(decUtil.OUTPUT))
    .map((member: IMember) => {
      const { identifier } = member;
      return {
        identifier,
        in: member.in,
      } as IOutputMemberMetadata;
    });
};
