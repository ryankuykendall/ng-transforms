import ts from 'typescript';

export interface INameableProxy {
  name: ts.Identifier;
}

export const getName = (declaration: INameableProxy): string => {
  return declaration.name.escapedText as string;
};

type ExpressionProxy =
  | ts.ExpressionWithTypeArguments
  | ts.NewExpression
  | ts.PropertyAccessExpression;

export const getExpressionIdentifier = (node: ExpressionProxy): string => {
  return node.expression.getText();
};
