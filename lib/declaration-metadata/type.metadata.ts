import ts from 'typescript';
import { basicTypeMap, complexTypeMap, objectTypeMap, BasicType, DataType } from './base.metadata';
import { IType } from './type.interface';
import chalk from 'chalk';

export const getTypeFromNode = (typeNode: ts.TypeNode): DataType => {
  // TODO (ryan): Investigate! Somehow in the compiled TS typeNode can be undefined!
  // To repro run query:
  //   ./dist/index.js collect-interface-declarations ~/ng-components/components/src/material/tabs/.
  if (typeNode) {
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
  // TODO (ryan): Investigate! Somehow in the compiled TS typeNode can be undefined!
  //   Perhaps when we hit a LiteralKeyword?
  // To repro run query:
  //   ./dist/index.js collect-interface-declarations ~/ng-components/components/src/material/tabs/.
  // Also make sure to address any of the Unrecognized childNodeTypes.
  if (!typeNode) return [];

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

  return collectTypeArgumentMetadata(typeNode, argumentNodes);
};

export const collectTypeArgumentMetadata = (
  parent: ts.Node,
  argumentNodes: ts.TypeNode[]
): IType[] => {
  const args: IType[] = [];
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
      } else if (ts.isLiteralTypeNode(childTypeNode)) {
        childTypeArg.literal = childTypeNode.getText();
      } else {
        console.warn(
          'Pass through for childNodeType in',
          ts.SyntaxKind[parent.kind],
          ts.SyntaxKind[childTypeNode.kind],
          chalk.bgBlueBright.black(parent.getFullText()),
          chalk.bgYellow.black(childTypeNode.getFullText())
        );
      }

      args.push(childTypeArg);
    });
  } else if (ts.isArrayTypeNode(parent)) {
    args.push(getTypeArgumentsFromArrayType(parent));
  }

  return args;
};
