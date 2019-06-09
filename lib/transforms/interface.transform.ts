import ts from 'typescript';
import * as decIdsUtil from './../utils/decorator-identifier.util';
import * as decUtil from './../utils/decorator.util';
import * as idUtil from './../utils/identifier.util';
import * as ngMetadata from './../interfaces/ng-metadata.interface';

// Note: In classes/components/directives where we can not make a good decision around
//   how to define the metadata or defaults (say for getters or setters), we should just
//   capture it as a WARNING with the related code snippet so that we can try to address
//   it incrementally (or prompt the user to do it for use!)

export function collectMetadata<T extends ts.Node>(
  interfaces: ngMetadata.INgInterfaceMetaDataRoot,
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
        const identifier = idUtil.getName(node as idUtil.NameableProxy);
        const metadata: ngMetadata.IEnumMetadata = {
          filepath,
          identifier,
        };
        callback.call(null, interfaces, ngMetadata.RootType.enums, metadata);
      }

      // Collect Interfaces
      if (ts.isInterfaceDeclaration(node)) {
        const identifier = idUtil.getName(node as idUtil.NameableProxy);
        const metadata: ngMetadata.IInterfaceMetadata = {
          filepath,
          identifier,
        };
        callback.call(null, interfaces, ngMetadata.RootType.interfaces, metadata);
      }

      return ts.visitEachChild(node, child => visit(child), context);
    };

    return node => ts.visitNode(node, visit);
  };
}
