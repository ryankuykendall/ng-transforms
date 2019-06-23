import ts from 'typescript';
import { basicTypeMap, complexTypeMap, objectTypeMap, BasicType, DataType } from './base.metadata';
import { IType } from './type.interface';

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

const getTypeArgumentsFromArrayType = (typeNode: ts.ArrayTypeNode): IType => {
  return {
    type: getTypeFromNode(typeNode.elementType),
    args: getTypeArguments(typeNode.elementType as ts.TypeReferenceNode),
  };
};

export const getTypeCompositionFromNode = (typeNode: ts.TypeNode): IType => {
  return {
    type: getTypeFromNode(typeNode),
    args: getTypeArguments(typeNode as ts.TypeReferenceNode),
  };
};

const getTypeArguments = (typeNode: ts.TypeReferenceNode): IType[] => {
  const typeArgumentsNode = typeNode.typeArguments;
  let args: IType[] = [];

  if (typeArgumentsNode && typeArgumentsNode.length > 0) {
    typeArgumentsNode.forEach(childTypeNode => {
      const childType = getTypeFromNode(childTypeNode);
      const childTypeArg: IType = {
        type: childType,
      };

      // Recurse to capture nested child types.
      if (ts.isTypeReferenceNode(childTypeNode)) {
        childTypeArg.args = getTypeArguments(childTypeNode);
      }

      if (ts.isArrayTypeNode(childTypeNode)) {
        childTypeArg.args = [getTypeArgumentsFromArrayType(childTypeNode)];
      }

      args.push(childTypeArg);
    });
  } else if (ts.isArrayTypeNode(typeNode)) {
    args.push(getTypeArgumentsFromArrayType(typeNode));
  }

  return args;
};
