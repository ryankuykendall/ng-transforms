import ts from 'typescript';
import path from 'path';
import { isDecoratorWithName } from '../../utils/decorator.util';
import { NgClassDecorator } from '../../utils/decorator-identifier.util';
import {
  hasKey,
  getPropertyAsArrayLiteralExpression,
  mapPropertyNamesToObjectLiteralElementLikes,
} from '../../utils/object-literal-expression.util';
import { Property as NgModuleDecoratorProperty } from '../../declaration-metadata/ng-module-decorator.property';
import logger from '../../utils/logger.util';

export type IdentifiersByFile = Map<string, Set<string>>;

function addImportDeclarationsTransform<T extends ts.Node>(
  identifiers: IdentifiersByFile
): ts.TransformerFactory<T> {
  return context => {
    const visit: ts.Visitor = node => {
      let workingNode = node;

      if (ts.isSourceFile(workingNode)) {
        workingNode = ts.getMutableClone(workingNode);
        if ((workingNode as ts.SourceFile).statements) {
          const allStatements: ts.Statement[] = (workingNode as ts.SourceFile).statements.map(
            (statement: ts.Statement) => statement
          );

          const lastImportDeclarationIndex: number = lastIndexOfKind(
            allStatements,
            ts.SyntaxKind.ImportDeclaration
          );

          // TODO (ryan): Better error checking here in the event that
          //   lastIndex === -1
          const preStatements = allStatements.slice(0, lastImportDeclarationIndex + 1);
          const postStatements = allStatements.slice(lastImportDeclarationIndex + 1);

          const newImportDeclarations = Array.from(identifiers.entries())
            .sort(([x], [y]) => {
              // sort by filepath
              return x > y ? 1 : -1;
            })
            .map(([filepath, identifiers]) => createImportDeclarationFrom(filepath, identifiers));

          (workingNode as ts.SourceFile).statements = ts.createNodeArray<ts.Statement>([
            ...preStatements,
            ...newImportDeclarations,
            ...postStatements,
          ]);
        }
      }
      // Match working node and then apply transform

      return ts.visitEachChild(workingNode, child => visit(child), context);
    };

    return node => ts.visitNode(node, visit);
  };
}

function addImportsToNgModuleDecoratorTransform<T extends ts.Node>(
  identifiers: string[]
): ts.TransformerFactory<T> {
  return context => {
    const visit: ts.Visitor = node => {
      let workingNode = node;

      if (
        ts.isDecorator(workingNode) &&
        isDecoratorWithName(workingNode, NgClassDecorator.NgModule)
      ) {
        const decorator = ts.getMutableClone(workingNode) as ts.Decorator;
        if (decorator.expression && ts.isCallExpression(decorator.expression)) {
          const callExp = decorator.expression as ts.CallExpression;
          if (callExp.arguments) {
            const [objLitExp] = callExp.arguments;
            if (objLitExp && ts.isObjectLiteralExpression(objLitExp)) {
              const propertyMap: Map<
                NgModuleDecoratorProperty,
                ts.ObjectLiteralElementLike
              > = mapPropertyNamesToObjectLiteralElementLikes(objLitExp);
              const importsAssignment = propertyMap.get(NgModuleDecoratorProperty.Imports);
              if (
                importsAssignment &&
                ts.isPropertyAssignment(importsAssignment) &&
                importsAssignment.initializer &&
                ts.isArrayLiteralExpression(importsAssignment.initializer)
              ) {
                const initializer: ts.ArrayLiteralExpression = importsAssignment.initializer;
                const elements: ts.Expression[] = initializer.elements.map(
                  (expression: ts.Expression) => expression
                );

                identifiers.sort().forEach((identifier: string) => {
                  elements.push(ts.createIdentifier(identifier));
                });

                importsAssignment.initializer = ts.createArrayLiteral(elements);
              }
            }
          }
        }

        workingNode = decorator;
      }
      // Match working node and then apply transform

      return ts.visitEachChild(workingNode, child => visit(child), context);
    };

    return node => ts.visitNode(node, visit);
  };
}

function renameClassDeclarationIdentifier<T extends ts.Node>(
  toIdentifier: string,
  fromIdentifier: string
): ts.TransformerFactory<T> {
  return context => {
    const visit: ts.Visitor = node => {
      let workingNode = node;

      if (
        ts.isClassDeclaration(workingNode) &&
        workingNode.name &&
        workingNode.name.getText() === fromIdentifier
      ) {
        workingNode = ts.getMutableClone(workingNode);
        (workingNode as ts.ClassDeclaration).name = ts.createIdentifier(toIdentifier);
      }

      return ts.visitEachChild(workingNode, child => visit(child), context);
    };

    return node => ts.visitNode(node, visit);
  };
}

export const invoke = (
  ast: ts.SourceFile,
  identifiers: IdentifiersByFile,
  toIdentifier: string,
  fromIdentifier: string
): ts.TransformationResult<ts.SourceFile> => {
  const allIdentifiers = Array.from(identifiers.values()).reduce(
    (collection: string[], item: Set<string>) => {
      return [...collection, ...Array.from(item)];
    },
    []
  );
  const allUniqueIdentifiers = Array.from(new Set<string>(allIdentifiers));

  return ts.transform(ast, [
    addImportDeclarationsTransform(identifiers),
    addImportsToNgModuleDecoratorTransform(allUniqueIdentifiers),
    renameClassDeclarationIdentifier(toIdentifier, fromIdentifier),
  ]) as ts.TransformationResult<ts.SourceFile>;
};

const createImportDeclarationFrom = (
  filepath: string,
  identifiers: Set<string>
): ts.ImportDeclaration => {
  const modulePath = path.join(path.dirname(filepath), path.basename(filepath, '.ts'));

  return ts.createImportDeclaration(
    undefined,
    undefined,
    ts.createImportClause(
      undefined,
      ts.createNamedImports(createImportSpecifiersFrom(identifiers))
    ),
    ts.createStringLiteral(modulePath)
  );
};

const createImportSpecifiersFrom = (identifiers: Set<string>): ts.ImportSpecifier[] => {
  return Array.from(identifiers)
    .sort()
    .map((identifier: string) =>
      ts.createImportSpecifier(undefined, ts.createIdentifier(identifier))
    );
};

const lastIndexOfKind = (collection: ts.Node[], kind: ts.SyntaxKind): number => {
  return collection.reduce((lastIndex, node: ts.Node, currentIndex: number) => {
    if (node.kind === kind) {
      lastIndex = currentIndex;
    }
    return lastIndex;
  }, -1);
};
