import ts from 'typescript';

export type IdentifiersByFile = Map<string, Set<string>>;

function addImportDeclarationsTransform<T extends ts.Node>(
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

function addImportsToNgModuleDecoratorTransform<T extends ts.Node>(
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
        console.log(` -- Transforming -- `, toIdentifier, fromIdentifier);
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
