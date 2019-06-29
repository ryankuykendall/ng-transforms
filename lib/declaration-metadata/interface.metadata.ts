import ts from 'typescript';

import * as idUtil from './../utils/identifier.util';
import * as dmIfIf from './interface.interface';
import { IFunctionMetadata } from './function.interface';
import { IMethodMetadata } from './method.interface';
import { getMethodMetadata } from './method.metadata';
import { getTypeFromNode, getTypeCompositionFromNode } from './type.metadata';

import { BasicType } from './base.metadata';

interface TypeElementNodeDistribution {
  propertyNodes: ts.PropertySignature[];
  functionNodes: ts.PropertySignature[];
  methodNodes: ts.MethodSignature[];
}

const distributeTypeElementNodes = (node: ts.InterfaceDeclaration): TypeElementNodeDistribution => {
  return node.members.reduce(
    (distribution: TypeElementNodeDistribution, prop: ts.TypeElement) => {
      if (ts.isMethodSignature(prop)) {
        distribution.methodNodes.push(prop);
      } else if (ts.isPropertySignature(prop)) {
        if (prop.type && getTypeFromNode(prop.type) === BasicType.Function) {
          distribution.functionNodes.push(prop);
        } else {
          distribution.propertyNodes.push(prop);
        }
      }
      return distribution;
    },
    { propertyNodes: [], functionNodes: [], methodNodes: [] }
  );
};

const getPropertySignatureMetadata = (
  prop: ts.PropertySignature
): dmIfIf.IInterfacePropertyMetadata => {
  const propId = idUtil.getName(prop as idUtil.INameableProxy);
  const optional = !!prop.questionToken;
  const composition = getTypeCompositionFromNode(prop.type as ts.TypeReferenceNode);

  return {
    identifier: propId,
    optional,
    ...composition,
  };
};

const getMethodSignatureMetadata = (prop: ts.MethodSignature) => {
  const propId = idUtil.getName(prop as idUtil.INameableProxy);
  const methodMetadata = getMethodMetadata(prop);

  return {
    identifier: propId,
    ...methodMetadata,
  };
};

const getFunctionSignatureMetadata = (prop: ts.PropertySignature) => {
  const propId = idUtil.getName(prop as idUtil.INameableProxy);
  const methodMetadata = getMethodMetadata(prop.type as ts.FunctionTypeNode);
  const optional = !!prop.questionToken;

  return {
    identifier: propId,
    optional,
    ...methodMetadata,
  };
};

export const collectInterfaceMetadata = (
  node: ts.InterfaceDeclaration,
  filepath: string
): dmIfIf.IInterfaceMetadata => {
  const identifier = idUtil.getName(node as idUtil.INameableProxy);
  const { propertyNodes, functionNodes, methodNodes } = distributeTypeElementNodes(node);

  const properties: dmIfIf.IInterfacePropertyMetadata[] = propertyNodes.map(
    getPropertySignatureMetadata
  );
  const methods: IMethodMetadata[] = methodNodes.map(getMethodSignatureMetadata);
  const funcs: IFunctionMetadata[] = functionNodes.map(getFunctionSignatureMetadata);

  return {
    identifier,
    filepath,
    functions: funcs,
    methods,
    properties,
  };
};
