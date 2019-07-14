import ts from 'typescript';

const getDecoratorName = (decorator: ts.Decorator): string => {
  const expression = decorator.expression as ts.CallExpression;
  const identifier = expression.expression as ts.Identifier;
  return identifier.getText();
};

export const getDecoratorNames = (node: ts.Node): Set<string> => {
  if (Array.isArray(node.decorators)) {
    return new Set<string>(node.decorators.map(decorator => getDecoratorName(decorator)));
  }

  return new Set<string>();
};

export type NodeDecoratorMap = Map<string, ts.Decorator>;

export const getDecoratorMap = (node: ts.Node): NodeDecoratorMap => {
  if (Array.isArray(node.decorators)) {
    return node.decorators.reduce((collection, decorator) => {
      collection.set(getDecoratorName(decorator), decorator);
      return collection;
    }, new Map<string, ts.Decorator>());
  }

  return new Map<string, ts.Decorator>();
};

export const hasDecoratorWithName = (node: ts.Node, name: string): boolean => {
  return getDecoratorNames(node).has(name);
};
