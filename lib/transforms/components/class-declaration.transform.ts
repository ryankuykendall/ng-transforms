import ts from 'typescript';
import * as decUtil from './../../utils/decorator.util';
import * as decIdsUtil from './../../utils/decorator-identifier.util';
import * as namespaceUtil from './../../utils/namespace.util';

const ENDS_WITH_COMPONENT_REGEXP = /^(.+)(Component)$/;
const ENDS_WITH_ELEMENT_REGEXP = /^(.+)(Element)$/;

export function renameComponentToElement<T extends ts.Node>(): ts.TransformerFactory<T> {
  return context => {
    const visit: ts.Visitor = node => {
      let workingNode = node;

      if (
        ts.isClassDeclaration(workingNode) &&
        decUtil.hasDecoratorWithName(workingNode, decIdsUtil.COMPONENT)
      ) {
        const name = (workingNode.name as ts.Identifier).escapedText as string;
        let elementName = name;
        if (name.match(ENDS_WITH_COMPONENT_REGEXP)) {
          elementName = name.replace(ENDS_WITH_COMPONENT_REGEXP, '$1Element');
        } else if (!name.match(ENDS_WITH_ELEMENT_REGEXP)) {
          elementName = `${elementName}Element`;
        }

        workingNode = ts.getMutableClone(workingNode);
        (workingNode as ts.ClassDeclaration).name = ts.createIdentifier(elementName);
      }

      return ts.visitEachChild(workingNode, child => visit(child), context);
    };

    return node => ts.visitNode(node, visit);
  };
}

export function placeInNamespace<T extends ts.Node>(
  namespaces: string[]
): ts.TransformerFactory<T> {
  // Cache for previously visited matching ClassDeclarations
  const namespacedClassDeclarations = new Set<ts.ClassDeclaration>();

  return context => {
    const visit: ts.Visitor = node => {
      let workingNode = node;

      if (
        ts.isClassDeclaration(workingNode) &&
        decUtil.hasDecoratorWithName(workingNode, decIdsUtil.COMPONENT) &&
        namespaces.length > 0 &&
        !namespacedClassDeclarations.has(workingNode)
      ) {
        const rootNamespaceName = namespaces.shift();
        if (rootNamespaceName) {
          const rootNamespace = namespaceUtil.createNamespaceWithIdentifier(rootNamespaceName);
          let referenceNamespace = rootNamespace;

          namespaces.forEach((namespace: string) => {
            const childNamespace = namespaceUtil.createNamespaceWithIdentifier(namespace);
            (referenceNamespace as ts.ModuleDeclaration).body = ts.createModuleBlock([
              childNamespace,
            ]);
            referenceNamespace = childNamespace;
          });

          (referenceNamespace as ts.ModuleDeclaration).body = ts.createModuleBlock([workingNode]);

          // Cache a copy of this node so that it doesn't recursively get namespaced again.
          namespacedClassDeclarations.add(workingNode);

          workingNode = rootNamespace;
        }
      }

      return ts.visitEachChild(workingNode, child => visit(child), context);
    };

    return node => ts.visitNode(node, visit);
  };
}
