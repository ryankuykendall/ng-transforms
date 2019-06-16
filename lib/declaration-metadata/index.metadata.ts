import ts from 'typescript';
import * as decIdsUtil from './../utils/decorator-identifier.util';
import * as decUtil from './../utils/decorator.util';
import * as idUtil from './../utils/identifier.util';
import * as dmIfIf from './interface.interface';

import { IClassMetadata } from './class.interface';
import { IComponentMetadata } from './component.interface';
import { IDirectiveMetadata } from './directive.interface';
import { IEnumMetadata } from './enum.interface';
import { collectEnumMetadata } from './enum.metadata';
import { INgModuleMetadata } from './ng-module.interface';

import { BasicType, DataType, basicTypeMap, objectTypeMap, complexTypeMap } from './base.metadata';
import { IRootMetadata, RootCollectorCallbackType, RootType } from './root.interface';
import { rootCollectorCallback } from './root.metadata';

import chalk from 'chalk';

export { IRootMetadata, rootCollectorCallback };

const getTypeFromNode = (typeNode: ts.TypeNode): DataType => {
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

const getTypeArgumentsFromArrayType = (typeNode: ts.ArrayTypeNode): dmIfIf.ITypeArgument => {
  return {
    type: getTypeFromNode(typeNode.elementType),
    typeArguments: getTypeArguments(typeNode.elementType as ts.TypeReferenceNode),
  };
};

const getTypeArguments = (typeNode: ts.TypeReferenceNode): dmIfIf.ITypeArgument[] => {
  const typeArgumentsNode = typeNode.typeArguments;
  let args: dmIfIf.ITypeArgument[] = [];

  if (typeArgumentsNode && typeArgumentsNode.length > 0) {
    typeArgumentsNode.forEach(childTypeNode => {
      const childType = getTypeFromNode(childTypeNode);
      const childTypeArg: dmIfIf.ITypeArgument = {
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
): dmIfIf.IMethodParameter[] => {
  return node.parameters.map(
    (param: ts.ParameterDeclaration): dmIfIf.IMethodParameter => {
      let type: DataType = BasicType.Unknown;
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

const getMethodMetadata = (node: ts.MethodSignature | ts.FunctionTypeNode): dmIfIf.IMethodBase => {
  let parameters = getMethodParameters(node);

  let returnType: dmIfIf.IReturn = {
    type: BasicType.Void,
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
  const propId = idUtil.getName(prop as idUtil.NameableProxy);
  const optional = !!prop.questionToken;
  let type: DataType = BasicType.Unknown;
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
): dmIfIf.IInterfaceMetadata => {
  const identifier = idUtil.getName(node as idUtil.NameableProxy);
  const { propertyNodes, functionNodes, methodNodes } = distributeTypeElementNodes(node);

  const properties: dmIfIf.IInterfacePropertyMetadata[] = propertyNodes.map(
    getPropertySignatureMetadata
  );
  const methods: dmIfIf.IMethodMetadata[] = methodNodes.map(getMethodSignatureMetadata);
  const funcs: dmIfIf.IFunctionMetadata[] = functionNodes.map(getFunctionSignatureMetadata);

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
  interfaces: IRootMetadata,
  filepath: string,
  callback: RootCollectorCallbackType
): ts.TransformerFactory<T> {
  return context => {
    const visit: ts.Visitor = node => {
      if (ts.isClassDeclaration(node)) {
        // TODO (ryan): Encapsulate all of this casting!
        const identifier = idUtil.getName(node as idUtil.NameableProxy);

        if (decUtil.hasDecoratorWithName(node, decIdsUtil.COMPONENT)) {
          const metadata: IComponentMetadata = {
            filepath,
            identifier,
          };
          callback.call(null, interfaces, RootType.components, metadata);
        } else if (decUtil.hasDecoratorWithName(node, decIdsUtil.DIRECTIVE)) {
          const metadata: IDirectiveMetadata = {
            filepath,
            identifier,
          };
          callback.call(null, interfaces, RootType.directives, metadata);
        } else if (decUtil.hasDecoratorWithName(node, decIdsUtil.NG_MODULE)) {
          const metadata: INgModuleMetadata = {
            filepath,
            identifier,
          };
          callback.call(null, interfaces, RootType.modules, metadata);
        } else {
          const metadata: IClassMetadata = {
            filepath,
            identifier,
          };
          callback.call(null, interfaces, RootType.classes, metadata);
        }
      }

      // Collect Enums
      if (ts.isEnumDeclaration(node)) {
        const metadata: IEnumMetadata = collectEnumMetadata(node, filepath);
        callback.call(null, interfaces, RootType.enums, metadata);
      }

      // Collect Interfaces
      if (ts.isInterfaceDeclaration(node)) {
        const metadata: dmIfIf.IInterfaceMetadata = collectInterfaceMetadata(node, filepath);
        callback.call(null, interfaces, RootType.interfaces, metadata);
      }

      return ts.visitEachChild(node, child => visit(child), context);
    };

    return node => ts.visitNode(node, visit);
  };
}
