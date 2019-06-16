import ts from 'typescript';
import * as decIdsUtil from './../utils/decorator-identifier.util';
import * as decUtil from './../utils/decorator.util';
import * as idUtil from './../utils/identifier.util';
import * as dmInterfaceInter from './interface.interface';

import chalk from 'chalk';

const getTypeFromNode = (typeNode: ts.TypeNode): dmInterfaceInter.DataType => {
  let type = dmInterfaceInter.basicTypeMap.get(typeNode.kind);
  if (type) {
    return type;
  }
  type = dmInterfaceInter.objectTypeMap.get(typeNode.kind);
  if (type) {
    return type;
  }
  const typeHandler = dmInterfaceInter.complexTypeMap.get(typeNode.kind);
  if (typeHandler) {
    type = typeHandler.call(null, typeNode);
    return type;
  }

  return dmInterfaceInter.BasicType.Unknown;
};

const getTypeArgumentsFromArrayType = (
  typeNode: ts.ArrayTypeNode
): dmInterfaceInter.ITypeArgument => {
  return {
    type: getTypeFromNode(typeNode.elementType),
    typeArguments: getTypeArguments(typeNode.elementType as ts.TypeReferenceNode),
  };
};

const getTypeArguments = (typeNode: ts.TypeReferenceNode): dmInterfaceInter.ITypeArgument[] => {
  const typeArgumentsNode = typeNode.typeArguments;
  let args: dmInterfaceInter.ITypeArgument[] = [];

  if (typeArgumentsNode && typeArgumentsNode.length > 0) {
    typeArgumentsNode.forEach(childTypeNode => {
      const childType = getTypeFromNode(childTypeNode);
      const childTypeArg: dmInterfaceInter.ITypeArgument = {
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

const getMethodParameters = (
  node: ts.MethodSignature | ts.FunctionTypeNode
): dmInterfaceInter.IMethodParameter[] => {
  return node.parameters.map(
    (param: ts.ParameterDeclaration): dmInterfaceInter.IMethodParameter => {
      let type: dmInterfaceInter.DataType = dmInterfaceInter.BasicType.Unknown;
      let typeArguments;
      if (param.type) {
        type = getTypeFromNode(param.type);
        typeArguments = getTypeArguments(param.type as ts.TypeReferenceNode);
      }

      return {
        identifier: idUtil.getName(param as idUtil.NameableProxy),
        type,
        typeArguments,
      };
    }
  );
};

const getMethodMetadata = (
  node: ts.MethodSignature | ts.FunctionTypeNode
): dmInterfaceInter.IMethodBase => {
  let parameters = getMethodParameters(node);

  let returnType: dmInterfaceInter.IReturn = {
    type: dmInterfaceInter.BasicType.Void,
  };

  if (node.type) {
    returnType.type = getTypeFromNode(node.type);
    returnType.typeArguments = getTypeArguments(node.type as ts.TypeReferenceNode);
  }

  return {
    parameters,
    returns: returnType,
  };
};

const collectEnumMetadata = (
  node: ts.EnumDeclaration,
  filepath: string
): dmInterfaceInter.IEnumMetadata => {
  const identifier = idUtil.getName(node as idUtil.NameableProxy);
  const members = node.members.map((member: ts.EnumMember, index) => {
    const memberId = idUtil.getName(member as idUtil.NameableProxy);
    let value: number | string = index;
    let type = dmInterfaceInter.EnumMemberType.Number;
    if (member.initializer) {
      if (ts.isNumericLiteral(member.initializer)) {
        value = parseInt(member.initializer.getText(), 10);
      } else if (ts.isStringLiteral(member.initializer)) {
        type = dmInterfaceInter.EnumMemberType.String;
        value = member.initializer.text;
      }
    }

    return {
      identifier: memberId,
      type,
      value,
    };
  }) as dmInterfaceInter.EnumMemberMetadataType[];

  return {
    filepath,
    identifier,
    members,
  } as dmInterfaceInter.IEnumMetadata;
};

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
        if (prop.type && getTypeFromNode(prop.type) === dmInterfaceInter.BasicType.Function) {
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
): dmInterfaceInter.IInterfacePropertyMetadata => {
  const propId = idUtil.getName(prop as idUtil.NameableProxy);
  const optional = !!prop.questionToken;
  let type: dmInterfaceInter.DataType = dmInterfaceInter.BasicType.Unknown;
  let typeArgs;
  if (prop.type) {
    type = getTypeFromNode(prop.type);
    typeArgs = getTypeArguments(prop.type as ts.TypeReferenceNode);
  }

  return {
    identifier: propId,
    optional,
    type,
    typeArguments: typeArgs,
  };
};

const getMethodSignatureMetadata = (prop: ts.MethodSignature) => {
  const propId = idUtil.getName(prop as idUtil.NameableProxy);
  const methodMetadata = getMethodMetadata(prop);

  return {
    identifier: propId,
    ...methodMetadata,
  };
};

const getFunctionSignatureMetadata = (prop: ts.PropertySignature) => {
  const propId = idUtil.getName(prop as idUtil.NameableProxy);
  const methodMetadata = getMethodMetadata(prop.type as ts.FunctionTypeNode);
  const optional = !!prop.questionToken;

  return {
    identifier: propId,
    optional,
    ...methodMetadata,
  };
};

const collectInterfaceMetadata = (
  node: ts.InterfaceDeclaration,
  filepath: string
): dmInterfaceInter.IInterfaceMetadata => {
  const identifier = idUtil.getName(node as idUtil.NameableProxy);
  const { propertyNodes, functionNodes, methodNodes } = distributeTypeElementNodes(node);

  const properties: dmInterfaceInter.IInterfacePropertyMetadata[] = propertyNodes.map(
    getPropertySignatureMetadata
  );
  const methods: dmInterfaceInter.IMethodMetadata[] = methodNodes.map(getMethodSignatureMetadata);
  const funcs: dmInterfaceInter.IFunctionMetadata[] = functionNodes.map(
    getFunctionSignatureMetadata
  );

  return {
    identifier,
    filepath,
    functions: funcs,
    methods,
    properties,
  };
};

// Note: In classes/components/directives where we can not make a good decision around
//   how to define the metadata or defaults (say for getters or setters), we should just
//   capture it as a WARNING with the related code snippet so that we can try to address
//   it incrementally (or prompt the user to do it for use!)

export function collectMetadata<T extends ts.Node>(
  interfaces: dmInterfaceInter.INgInterfaceMetadataRoot,
  filepath: string,
  callback: dmInterfaceInter.RootCollectorCallbackType
): ts.TransformerFactory<T> {
  return context => {
    const visit: ts.Visitor = node => {
      if (ts.isClassDeclaration(node)) {
        // TODO (ryan): Encapsulate all of this casting!
        const identifier = idUtil.getName(node as idUtil.NameableProxy);

        if (decUtil.hasDecoratorWithName(node, decIdsUtil.COMPONENT)) {
          const metadata: dmInterfaceInter.IComponentMetadata = {
            filepath,
            identifier,
          };
          callback.call(null, interfaces, dmInterfaceInter.RootType.components, metadata);
        } else if (decUtil.hasDecoratorWithName(node, decIdsUtil.DIRECTIVE)) {
          const metadata: dmInterfaceInter.IDirectiveMetadata = {
            filepath,
            identifier,
          };
          callback.call(null, interfaces, dmInterfaceInter.RootType.directives, metadata);
        } else if (decUtil.hasDecoratorWithName(node, decIdsUtil.NG_MODULE)) {
          const metadata: dmInterfaceInter.INgModuleMetadata = {
            filepath,
            identifier,
          };
          callback.call(null, interfaces, dmInterfaceInter.RootType.modules, metadata);
        } else {
          const metadata: dmInterfaceInter.IClassMetadata = {
            filepath,
            identifier,
          };
          callback.call(null, interfaces, dmInterfaceInter.RootType.classes, metadata);
        }
      }

      // Collect Enums
      if (ts.isEnumDeclaration(node)) {
        const metadata: dmInterfaceInter.IEnumMetadata = collectEnumMetadata(node, filepath);
        callback.call(null, interfaces, dmInterfaceInter.RootType.enums, metadata);
      }

      // Collect Interfaces
      if (ts.isInterfaceDeclaration(node)) {
        const metadata: dmInterfaceInter.IInterfaceMetadata = collectInterfaceMetadata(
          node,
          filepath
        );
        callback.call(null, interfaces, dmInterfaceInter.RootType.interfaces, metadata);
      }

      return ts.visitEachChild(node, child => visit(child), context);
    };

    return node => ts.visitNode(node, visit);
  };
}
