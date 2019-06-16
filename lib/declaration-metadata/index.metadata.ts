import ts from 'typescript';
import * as decIdsUtil from './../utils/decorator-identifier.util';
import * as decUtil from './../utils/decorator.util';
import * as idUtil from './../utils/identifier.util';

import { IClassMetadata } from './class.interface';
import { collectClassMetadata } from './class.metadata';
import { IComponentMetadata } from './component.interface';
import { collectComponentMetadata } from './component.metadata';
import { IDirectiveMetadata } from './directive.interface';
import { collectDirectiveMetadata } from './directive.metadata';
import { IEnumMetadata } from './enum.interface';
import { collectEnumMetadata } from './enum.metadata';
import * as dmIfIf from './interface.interface';
import { collectInterfaceMetadata } from './interface.metadata';
import { INgModuleMetadata } from './ng-module.interface';
import { collectNgModuleMetadata } from './ng-module.metadata';

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
        if (decUtil.hasDecoratorWithName(node, decIdsUtil.COMPONENT)) {
          const metadata: IComponentMetadata = collectComponentMetadata(node, filepath);
          callback.call(null, interfaces, RootType.components, metadata);
        } else if (decUtil.hasDecoratorWithName(node, decIdsUtil.DIRECTIVE)) {
          const metadata: IDirectiveMetadata = collectDirectiveMetadata(node, filepath);
          callback.call(null, interfaces, RootType.directives, metadata);
        } else if (decUtil.hasDecoratorWithName(node, decIdsUtil.NG_MODULE)) {
          const metadata: INgModuleMetadata = collectNgModuleMetadata(node, filepath);
          callback.call(null, interfaces, RootType.modules, metadata);
        } else {
          const metadata: IClassMetadata = collectClassMetadata(node, filepath);
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
