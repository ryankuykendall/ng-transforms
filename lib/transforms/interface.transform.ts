import ts from 'typescript';
import * as decIdsUtil from './../utils/decorator-identifier.util';
import * as decUtil from './../utils/decorator.util';
import * as idUtil from './../utils/identifier.util';
import * as ngMetadata from './../interfaces/ng-metadata.interface';

const getTypeFromNode = (typeNode: ts.TypeNode): ngMetadata.DataType => {
  let type = ngMetadata.basicTypeMap.get(typeNode.kind);
  if (type) {
    return type;
  }
  type = ngMetadata.objectTypeMap.get(typeNode.kind);
  if (type) {
    return type;
  }
  const typeHandler = ngMetadata.complexTypeMap.get(typeNode.kind);
  if (typeHandler) {
    type = typeHandler.call(null, typeNode);
    return type;
  }

  return ngMetadata.BasicType.Unknown;
};

const getTypeArguments = (typeNode: ts.TypeReferenceNode): ngMetadata.ITypeArguments[] => {
  const typeArgumentsNode = typeNode.typeArguments;
  let args: ngMetadata.ITypeArguments[] = [];
  if (typeArgumentsNode && typeArgumentsNode.length > 0) {
    typeArgumentsNode.forEach(childTypeNode => {
      const childType = getTypeFromNode(childTypeNode);
      const childTypeArg: ngMetadata.ITypeArguments = {
        type: childType,
      };

      // Recurse to capture nested child types.
      if (ts.isTypeReferenceNode(childTypeNode)) {
        childTypeArg.typeArguments = getTypeArguments(childTypeNode);
      }

      args.push(childTypeArg);
    });
  }

  return args;
};

const collectEnumMetadata = (
  node: ts.EnumDeclaration,
  filepath: string
): ngMetadata.IEnumMetadata => {
  const identifier = idUtil.getName(node as idUtil.NameableProxy);
  const members = node.members.map((member: ts.EnumMember, index) => {
    const memberId = idUtil.getName(member as idUtil.NameableProxy);
    let value: number | string = index;
    let type = ngMetadata.EnumMemberType.Number;
    if (member.initializer) {
      if (ts.isNumericLiteral(member.initializer)) {
        value = parseInt(member.initializer.getText(), 10);
      } else if (ts.isStringLiteral(member.initializer)) {
        type = ngMetadata.EnumMemberType.String;
        value = member.initializer.text;
      }
    }

    return {
      identifier: memberId,
      type,
      value,
    };
  }) as ngMetadata.EnumMemberMetadataType[];

  return {
    filepath,
    identifier,
    members,
  } as ngMetadata.IEnumMetadata;
};

const collectInterfaceMetadata = (
  node: ts.InterfaceDeclaration,
  filepath: string
): ngMetadata.IInterfaceMetadata => {
  const identifier = idUtil.getName(node as idUtil.NameableProxy);

  const methods: ngMetadata.IInterfaceMethodMetadata[] = node.members
    .filter(member => ts.isMethodSignature(member))
    .map(member => member as ts.MethodSignature)
    .map((prop: ts.MethodSignature) => {
      const propId = idUtil.getName(prop as idUtil.NameableProxy);
      return {
        identifier: propId,
      };
    });

  // NOTE (ryan): We may want to separate properties that are functions from
  //   this set of properties because of arguments
  const properties: ngMetadata.IInterfacePropertyMetadata[] = node.members
    .filter(member => ts.isPropertySignature(member))
    .map(member => member as ts.PropertySignature)
    .map(
      (prop: ts.PropertySignature): ngMetadata.IInterfacePropertyMetadata => {
        const propId = idUtil.getName(prop as idUtil.NameableProxy);
        const optional = !!prop.questionToken;
        let type = '[placeholder]';
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
      }
    );

  return {
    identifier,
    filepath,
    methods,
    properties,
  };
};

// Note: In classes/components/directives where we can not make a good decision around
//   how to define the metadata or defaults (say for getters or setters), we should just
//   capture it as a WARNING with the related code snippet so that we can try to address
//   it incrementally (or prompt the user to do it for use!)

export function collectMetadata<T extends ts.Node>(
  interfaces: ngMetadata.INgInterfaceMetadataRoot,
  filepath: string,
  callback: ngMetadata.RootCollectorCallbackType
): ts.TransformerFactory<T> {
  return context => {
    const visit: ts.Visitor = node => {
      if (ts.isClassDeclaration(node)) {
        // TODO (ryan): Encapsulate all of this casting!
        const identifier = idUtil.getName(node as idUtil.NameableProxy);

        if (decUtil.hasDecoratorWithName(node, decIdsUtil.COMPONENT)) {
          const metadata: ngMetadata.IComponentMetadata = {
            filepath,
            identifier,
          };
          callback.call(null, interfaces, ngMetadata.RootType.components, metadata);
        } else if (decUtil.hasDecoratorWithName(node, decIdsUtil.DIRECTIVE)) {
          const metadata: ngMetadata.IDirectiveMetadata = {
            filepath,
            identifier,
          };
          callback.call(null, interfaces, ngMetadata.RootType.directives, metadata);
        } else if (decUtil.hasDecoratorWithName(node, decIdsUtil.NG_MODULE)) {
          const metadata: ngMetadata.INgModuleMetadata = {
            filepath,
            identifier,
          };
          callback.call(null, interfaces, ngMetadata.RootType.modules, metadata);
        } else {
          const metadata: ngMetadata.IClassMetadata = {
            filepath,
            identifier,
          };
          callback.call(null, interfaces, ngMetadata.RootType.classes, metadata);
        }
      }

      // Collect Enums
      if (ts.isEnumDeclaration(node)) {
        const metadata: ngMetadata.IEnumMetadata = collectEnumMetadata(node, filepath);
        callback.call(null, interfaces, ngMetadata.RootType.enums, metadata);
      }

      // Collect Interfaces
      if (ts.isInterfaceDeclaration(node)) {
        const metadata: ngMetadata.IInterfaceMetadata = collectInterfaceMetadata(node, filepath);
        callback.call(null, interfaces, ngMetadata.RootType.interfaces, metadata);
      }

      return ts.visitEachChild(node, child => visit(child), context);
    };

    return node => ts.visitNode(node, visit);
  };
}
