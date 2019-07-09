import ts from 'typescript';
import { IType } from './type.interface';
import { BasicType } from './base.metadata';
import chalk from 'chalk';

// TODO (ryan): Complete this
export const collectExpressionMetadata = (node: ts.Expression): IType => {
  switch (node.kind) {
    case ts.SyntaxKind.StringLiteral:
      return {
        type: BasicType.String,
        literal: node.getText(),
      } as IType;
      break;
    default:
      console.error(
        chalk.yellow('Unhandled expression kind'),
        chalk.bgRed.white(ts.SyntaxKind[node.kind]),
        chalk.bgBlue.white(node.getFullText())
      );
      break;
  }

  return {
    type: BasicType.Unknown,
    args: [],
    literal: node.getText(),
  } as IType;
};
