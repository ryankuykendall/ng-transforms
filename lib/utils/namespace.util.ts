import ts from 'typescript';

export const createNamespaceWithIdentifier = (identifier: string): ts.ModuleDeclaration => {
  return ts.createModuleDeclaration(
    undefined,
    undefined,
    ts.createIdentifier(identifier),
    ts.createModuleBlock([]),
    ts.NodeFlags.Namespace
  );
};
