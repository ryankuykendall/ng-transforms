import ts from 'typescript';

export type IdentifiersByFile = Map<string, Set<string>>;

export function addImportDeclarationsTransform<T extends ts.Node>(
  identifiers: IdentifiersByFile
): ts.TransformerFactory<T> {
  return context => {
    const visit: ts.Visitor = node => {
      let workingNode = node;

      // Match working node and then apply transform

      return ts.visitEachChild(workingNode, child => visit(child), context);
    };

    return node => ts.visitNode(node, visit);
  };
}

export function addImportsToNgModuleDecoratorTransform<T extends ts.Node>(
  identifiers: string[]
): ts.TransformerFactory<T> {
  return context => {
    const visit: ts.Visitor = node => {
      let workingNode = node;

      // Match working node and then apply transform

      return ts.visitEachChild(workingNode, child => visit(child), context);
    };

    return node => ts.visitNode(node, visit);
  };
}

export const invoke = (
  ast: ts.SourceFile,
  identifiers: IdentifiersByFile
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
  ]) as ts.TransformationResult<ts.SourceFile>;
};
