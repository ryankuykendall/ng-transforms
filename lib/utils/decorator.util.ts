import ts from 'typescript';

export const getDecoratorNames = (node: ts.Node): Set<string> => {
  if (node.hasOwnProperty('decorators') && node.decorators) {
    return new Set<string>(
      node.decorators.map(decorator => {
        const expression = decorator.expression as ts.CallExpression;
        const identifier = expression.expression as ts.Identifier;
        return identifier.escapedText as string;
      })
    );
  }

  return new Set<string>();
};

export const hasDecoratorWithName = (node: ts.Node, name: string): boolean => {
  return getDecoratorNames(node).has(name);
};
