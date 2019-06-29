import ts from 'typescript';

export interface INameableProxy {
  name: ts.Identifier;
}

export const getName = (declaration: INameableProxy): string => {
  return declaration.name.escapedText as string;
};

export interface IExpressibleProxy {
  expression: ts.Identifier;
}

export const getExpressionIdentifier = (node: IExpressibleProxy): string => {
  return node.expression.getText();
};
