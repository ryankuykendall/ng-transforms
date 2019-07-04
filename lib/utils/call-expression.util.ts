import ts from 'typescript';
import chalk from 'chalk';

// TODO (ryan): Come up with a type definition that allows a more general
//   node type to be passed in here.
const getArgumentsAsArrayOfExpressions = (node: ts.Decorator): ts.Expression[] => {
  if (node.expression) {
    const expression = node.expression as ts.CallExpression;
    return expression.arguments.map((exp: ts.Expression) => exp);
  }
  return [];
};

export const getArgumentsAsStrings = (node: ts.Decorator): string[] => {
  return getArgumentsAsArrayOfExpressions(node).map((arg: ts.Expression): string => arg.getText());
};

export const getArgumentAtPositionAsString = (
  node: ts.Decorator,
  position: number
): string | undefined => {
  const args = getArgumentsAsArrayOfExpressions(node);
  const expression = args[position];
  if (expression && ts.isStringLiteral(expression)) {
    return expression.getText();
  }

  return;
};

export const getArgumentAtPositionAsArrayOfStrings = (
  node: ts.Decorator,
  position: number
): string[] => {
  const args = getArgumentsAsArrayOfExpressions(node);
  const expression = args[position];
  if (expression && ts.isArrayLiteralExpression(expression)) {
    return expression.elements.map(
      (literal: ts.Expression): string => (literal as ts.StringLiteral).getText()
    );
  }

  return [];
};
