import ts from 'typescript';
import {
  basicTypeMap,
  complexTypeMap,
  objectTypeMap,
  typeGroupMap,
  BasicType,
  DataType,
  TypeGroup,
} from './base.metadata';
import { IHeterogeneousType, ITypeArgument, ITypeComposition } from './type.interface';

export const getTypeFromNode = (typeNode: ts.TypeNode): DataType => {
  let type = basicTypeMap.get(typeNode.kind);
  if (type) {
    return type;
  }
  type = objectTypeMap.get(typeNode.kind);
  if (type) {
    return type;
  }
  const typeHandler = complexTypeMap.get(typeNode.kind);
  if (typeHandler) {
    type = typeHandler.call(null, typeNode);
    return type;
  }

  return BasicType.Unknown;
};

export const getTypeGroupFromNode = (typeNode: ts.TypeNode): TypeGroup => {
  return typeGroupMap.get(typeNode.kind) || TypeGroup.Unary;
};

const getTypeArgumentsFromArrayType = (typeNode: ts.ArrayTypeNode): ITypeArgument => {
  return {
    type: getTypeFromNode(typeNode.elementType),
    typeArguments: getTypeArguments(typeNode.elementType as ts.TypeReferenceNode),
  };
};

export const getAllTypesFromNode = (typeNode: ts.TypeNode): IHeterogeneousType => {
  if (ts.isUnionTypeNode(typeNode) || ts.isIntersectionTypeNode(typeNode)) {
    return {
      typeGroup: getTypeGroupFromNode(typeNode),
      types: typeNode.types.map(getAllTypesFromNode),
    } as ITypeComposition;
  } else {
    return getTypeArguments(typeNode as ts.TypeReferenceNode);
  }
};

export const getTypeCompositionFromNode = (typeNode: ts.TypeNode): ITypeComposition => {
  return {
    typeGroup: getTypeGroupFromNode(typeNode),
    types: [], // getAllTypesFromNode(typeNode),
  };
};

const getTypeArguments = (typeNode: ts.TypeReferenceNode): ITypeArgument[] => {
  const typeArgumentsNode = typeNode.typeArguments;
  let args: ITypeArgument[] = [];

  if (typeArgumentsNode && typeArgumentsNode.length > 0) {
    typeArgumentsNode.forEach(childTypeNode => {
      const childType = getTypeFromNode(childTypeNode);
      const childTypeArg: ITypeArgument = {
        type: childType,
      };

      // Recurse to capture nested child types.
      if (ts.isTypeReferenceNode(childTypeNode)) {
        childTypeArg.typeArguments = getTypeArguments(childTypeNode);
      }

      if (ts.isArrayTypeNode(childTypeNode)) {
        childTypeArg.typeArguments = [getTypeArgumentsFromArrayType(childTypeNode)];
      }

      args.push(childTypeArg);
    });
  } else if (ts.isArrayTypeNode(typeNode)) {
    args.push(getTypeArgumentsFromArrayType(typeNode));
  }

  return args;
};

// BIG QUESTION & TODO (ryan):
//   Should any assignment from getTypeFromNode be adding a member to an
//   array (such that all types are Unions, even if they are only Unions
//   of one?)

export const getTypeCompositionStub = (): ITypeComposition => {
  return {
    typeGroup: TypeGroup.Unary,
    types: [],
  };
};
