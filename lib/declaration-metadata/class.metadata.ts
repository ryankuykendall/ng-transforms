import ts from 'typescript';
import * as idUtil from './../utils/identifier.util';
import {
  IClassMetadata,
  IGetAccessorMetadata,
  ISetAccessorMetadata,
  IFunctionMetadata,
  IMethodMetadata,
  IPropertyMetadata,
  IConstructorMetadata,
  IHeritageMetadata,
  IInGroup,
  ClassMetadataGroup,
} from './class.interface';
import { getMethodMetadata, getMethodMetadataStub } from './method.metadata';
import { getTypeCompositionFromNode } from './type.metadata';
import { IHasIdentifier } from './base.interface';
import { NodeDecoratorMap, getDecoratorMap } from '../utils/decorator.util';

export const collectClassMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IClassMetadata => {
  const identifier = idUtil.getName(node as idUtil.INameableProxy);
  const heritage = collectHeritageMetadata(node);

  const memberDistribution = distributeMembers(node);
  let constructorDef;
  if (memberDistribution.constructorNode) {
    constructorDef = collectConstructorMetadata(memberDistribution.constructorNode);
  }
  const properties = memberDistribution.properties.map(collectPropertyMetadata);
  const functions = memberDistribution.functions.map(collectFunctionMetadata);
  const methods = memberDistribution.methods.map(collectMethodMetadata);
  const getters = memberDistribution.getAccessors.map(collectGetAccessorMetadata);
  const setters = memberDistribution.setAccessors.map(collectSetAccessorMetadata);

  return {
    identifier,
    filepath,
    heritage,
    constructorDef,
    properties,
    functions,
    methods,
    getters,
    setters,
  };
};

interface IMemberDistribution {
  constructorNode?: ts.ConstructorDeclaration;
  properties: ts.PropertyDeclaration[];
  functions: ts.PropertyDeclaration[];
  methods: ts.MethodDeclaration[];
  getAccessors: ts.GetAccessorDeclaration[];
  setAccessors: ts.SetAccessorDeclaration[];
  unknownDistribution: string[];
}

const collectHeritageMetadata = (node: ts.ClassDeclaration): IHeritageMetadata | undefined => {
  if (node.heritageClauses) {
    const heritage: IHeritageMetadata = {};
    node.heritageClauses.forEach((clause: ts.HeritageClause) => {
      const clauseText = clause.getText();
      if (clauseText.match(/^extends/)) {
        const extendsType = clause.types[0];
        const identifier = idUtil.getExpressionIdentifier(
          // QUESTION (ryan): Why is this necessary here but not
          //   with INameableProxy?
          (extendsType as unknown) as idUtil.IExpressibleProxy
        );
        const composition = getTypeCompositionFromNode(clause.types[0]);
        composition.type = identifier;
        heritage.extendsDef = composition;
      } else {
        heritage.implementsDef = clause.types.map(
          (implementsType: ts.ExpressionWithTypeArguments) => {
            const identifier = idUtil.getExpressionIdentifier(
              (implementsType as unknown) as idUtil.IExpressibleProxy
            );
            const compositon = getTypeCompositionFromNode(implementsType);
            compositon.type = identifier;
            return compositon;
          }
        );
      }
    });

    return heritage;
  }

  return;
};

const distributeMembers = (node: ts.ClassDeclaration): IMemberDistribution => {
  const distStub: IMemberDistribution = {
    properties: [],
    functions: [],
    methods: [],
    getAccessors: [],
    setAccessors: [],
    unknownDistribution: [],
  };
  const distribution: IMemberDistribution = node.members.reduce(
    (dist: IMemberDistribution, member: ts.ClassElement) => {
      if (ts.isConstructorDeclaration(member)) {
        dist.constructorNode = member;
      } else if (ts.isPropertyDeclaration(member)) {
        const propertyInitializer = member.initializer;
        if (
          propertyInitializer &&
          (ts.isArrowFunction(propertyInitializer) || ts.isFunctionExpression(propertyInitializer))
        ) {
          dist.functions.push(member);
        } else {
          dist.properties.push(member);
        }
      } else if (ts.isMethodDeclaration(member)) {
        dist.methods.push(member);
      } else if (ts.isGetAccessorDeclaration(member)) {
        dist.getAccessors.push(member);
      } else if (ts.isSetAccessor(member)) {
        dist.setAccessors.push(member);
      } else {
        dist.unknownDistribution.push(ts.SyntaxKind[member.kind]);
      }

      return dist;
    },
    distStub
  );

  return distribution;
};

const collectConstructorMetadata = (node: ts.ConstructorDeclaration): IConstructorMetadata => {
  const methodMetadata = getMethodMetadata(node);
  const injectedProperties = getConstructorInjectedProperties(node);

  // TODO (ryan): Make sure to grab dependency injected properties.
  return {
    ...methodMetadata,
    injectedProperties,
  };
};

const getConstructorInjectedProperties = (node: ts.ConstructorDeclaration): IPropertyMetadata[] => {
  // TODO (ryan): Capture this we know these are dependency injected because they are passed with
  //   public, protected, or private
  return [];
};

const collectPropertyMetadata = (property: ts.PropertyDeclaration): IPropertyMetadata => {
  const identifier = idUtil.getName(property as idUtil.INameableProxy);
  return {
    identifier,
  };
};

const collectFunctionMetadata = (func: ts.PropertyDeclaration): IFunctionMetadata => {
  const identifier = idUtil.getName(func as idUtil.INameableProxy);
  let methodMetadata = getMethodMetadataStub();

  if (func.initializer) {
    methodMetadata = getMethodMetadata(func.initializer as ts.FunctionExpression);
  }

  return {
    identifier,
    ...methodMetadata,
  };
};

const collectMethodMetadata = (method: ts.MethodDeclaration): IMethodMetadata => {
  const identifier = idUtil.getName(method as idUtil.INameableProxy);
  const methodMetadata = getMethodMetadata(method);

  return {
    identifier,
    ...methodMetadata,
  };
};

const collectGetAccessorMetadata = (accessor: ts.GetAccessorDeclaration): IGetAccessorMetadata => {
  const identifier = idUtil.getName(accessor as idUtil.INameableProxy);
  const methodMetadata = getMethodMetadata(accessor);

  return {
    identifier,
    ...methodMetadata,
  };
};

const collectSetAccessorMetadata = (accessor: ts.SetAccessorDeclaration): ISetAccessorMetadata => {
  const identifier = idUtil.getName(accessor as idUtil.INameableProxy);
  const methodMetadata = getMethodMetadata(accessor);

  return {
    identifier,
    ...methodMetadata,
  };
};

export type ClassMemberType =
  | ts.ConstructorDeclaration
  | ts.PropertyDeclaration
  | ts.MethodDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration;
export interface IMember extends IHasIdentifier, IInGroup {
  member: ClassMemberType;
  decorators: NodeDecoratorMap;
}

export const getMemberDistributionWithIdentifiersAndGroups = (
  node: ts.ClassDeclaration
): IMember[] => {
  const distribution = distributeMembers(node);
  const members: IMember[] = [
    // Properties
    ...distribution.properties.map((member: ts.PropertyDeclaration) => {
      return {
        identifier: idUtil.getName(member as idUtil.INameableProxy),
        in: ClassMetadataGroup.Property,
        member,
        decorators: getDecoratorMap(member),
      } as IMember;
    }),

    // Methods
    ...distribution.methods.map((member: ts.MethodDeclaration) => {
      return {
        identifier: idUtil.getName(member as idUtil.INameableProxy),
        in: ClassMetadataGroup.Method,
        member,
        decorators: getDecoratorMap(member),
      } as IMember;
    }),

    // Functions
    ...distribution.functions.map((member: ts.PropertyDeclaration) => {
      return {
        identifier: idUtil.getName(member as idUtil.INameableProxy),
        in: ClassMetadataGroup.Function,
        member,
        decorators: getDecoratorMap(member),
      } as IMember;
    }),

    // Getters
    ...distribution.getAccessors.map((member: ts.GetAccessorDeclaration) => {
      return {
        identifier: idUtil.getName(member as idUtil.INameableProxy),
        in: ClassMetadataGroup.Getter,
        member,
        decorators: getDecoratorMap(member),
      } as IMember;
    }),

    // Setters
    ...distribution.setAccessors.map((member: ts.SetAccessorDeclaration) => {
      return {
        identifier: idUtil.getName(member as idUtil.INameableProxy),
        in: ClassMetadataGroup.Setter,
        member,
        decorators: getDecoratorMap(member),
      } as IMember;
    }),
  ];

  // Add the constructor if it is defined
  if (distribution.constructorNode) {
    members.push({
      identifier: 'constructor',
      in: ClassMetadataGroup.Constructor,
      member: distribution.constructorNode,
      decorators: getDecoratorMap(distribution.constructorNode),
    });
  }

  return members;
};
