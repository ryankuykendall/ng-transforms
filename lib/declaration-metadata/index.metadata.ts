import ts from 'typescript';
import * as decIdsUtil from './../utils/decorator-identifier.util';
import * as decUtil from './../utils/decorator.util';
import * as idUtil from './../utils/identifier.util';

import * as dmIfIf from './interface.interface';
import { collectInterfaceMetadata } from './interface.metadata';

import { IClassMetadata } from './class.interface';
import { IComponentMetadata } from './component.interface';
import { IDirectiveMetadata } from './directive.interface';
import { IEnumMetadata } from './enum.interface';
import { collectEnumMetadata } from './enum.metadata';
import { INgModuleMetadata } from './ng-module.interface';

import { IRootMetadata, RootCollectorCallbackType, RootType } from './root.interface';
import { rootCollectorCallback } from './root.metadata';

export { IRootMetadata, rootCollectorCallback };

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
