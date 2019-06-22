import ts from 'typescript';
import * as idUtil from './../utils/identifier.util';
import { TypeGroup } from './base.metadata';
import { IMethodBase, IMethodParameter, IReturn } from './method.interface';
import {
  getAllTypesFromNode,
  getTypeCompositionStub,
  getTypeGroupFromNode,
  getTypeCompositionFromNode,
} from './type.metadata';

type ParameterizedNode = ts.MethodSignature | ts.FunctionTypeNode | ts.FunctionLikeDeclaration;

const getMethodParameters = (node: ParameterizedNode): IMethodParameter[] => {
  return node.parameters.map(
    (param: ts.ParameterDeclaration): IMethodParameter => {
      const composition = getTypeCompositionFromNode(param.type as ts.TypeReferenceNode);

      return {
        identifier: idUtil.getName(param as idUtil.NameableProxy),
        ...composition,
      };
    }
  );
};

export const getMethodMetadata = (node: ParameterizedNode): IMethodBase => {
  let parameters = getMethodParameters(node);
  let returnType = getReturnMetadataStub();

  if (node.type) {
    const composition = getTypeCompositionFromNode(node.type);
    returnType = {
      ...returnType,
      ...composition,
    };
  }

  return {
    parameters,
    returns: returnType,
  };
};

export const getMethodMetadataStub = (): IMethodBase => {
  return {
    parameters: [],
    returns: getReturnMetadataStub(),
  };
};

export const getReturnMetadataStub = (): IReturn => {
  return {
    typeGroup: TypeGroup.Unary,
    types: [],
  };
};
