import ts from 'typescript';

export const getArgumentsAsStrings = (node: ts.Decorator): string[] => {
  if (node.expression) {
    const expression = node.expression as ts.CallExpression;
    const callExpArgs = expression.arguments;
    if (callExpArgs && callExpArgs.length > 0) {
      return callExpArgs.map((arg: ts.Expression): string => arg.getText());
    }
  }

  return [];
};
