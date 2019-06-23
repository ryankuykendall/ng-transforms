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
  let args: IType[] = [];
  const argumentNodes: ts.TypeNode[] = [];
  if (typeNode.typeArguments) {
    typeNode.typeArguments.forEach(childTypeNode => {
      argumentNodes.push(childTypeNode);
    });
  }

  if (ts.isIntersectionTypeNode(typeNode) || ts.isUnionTypeNode(typeNode)) {
    typeNode.types.forEach(childTypeNode => {
      argumentNodes.push(childTypeNode);
    });
  }

  if (ts.isParenthesizedTypeNode(typeNode)) {
    argumentNodes.push(typeNode.type);
  }

  if (argumentNodes.length > 0) {
    argumentNodes.forEach(childTypeNode => {
      const childType = getTypeFromNode(childTypeNode);
      const childTypeArg: IType = {
        type: childType,
      };

      // Recurse to capture nested child types.
      if (
        ts.isTypeReferenceNode(childTypeNode) ||
        ts.isIntersectionTypeNode(childTypeNode) ||
        ts.isUnionTypeNode(childTypeNode) ||
        ts.isParenthesizedTypeNode(childTypeNode)
      ) {
        childTypeArg.args = getTypeArguments(childTypeNode as ts.TypeReferenceNode);
      } else if (ts.isArrayTypeNode(childTypeNode)) {
        childTypeArg.args = [getTypeArgumentsFromArrayType(childTypeNode)];
      } else {
        console.warn(
          'Unrecognized childNodeType in',
          ts.SyntaxKind[typeNode.kind],
          ts.SyntaxKind[childTypeNode.kind]
        );
      }

      args.push(childTypeArg);
    });
  } else if (ts.isArrayTypeNode(typeNode)) {
    args.push(getTypeArgumentsFromArrayType(typeNode));
  }

  return args;
};
