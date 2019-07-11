import ts, { TsConfigSourceFile } from 'typescript';
import { IType } from './type.interface';
import { BasicType } from './base.metadata';
import chalk from 'chalk';
import {
  INewExpression,
  ExpressionMetadata,
  ExpressionMetadataType,
  IPropertyAccessExpression,
  ICallExpression,
} from './expression.interface';
import { getExpressionIdentifier, getName, INameableProxy } from '../utils/identifier.util';
import { getTypeCompositionFromNode } from './type.metadata';

// TODO (ryan): Break each case into a separate method.
export const collectExpressionMetadata = (
  expression:
    | ts.Expression
    | ts.LeftHandSideExpression /** TODO (ryan): Create type alias for this? */
): ExpressionMetadata => {
  switch (expression.kind) {
    // Keep the cases sorted by SyntaxKind!
    case ts.SyntaxKind.CallExpression:
      return getCallExpressionMetadata(expression as ts.CallExpression);
    case ts.SyntaxKind.FalseKeyword:
      return getFalseKeywordMetadata();
    case ts.SyntaxKind.NewExpression:
      return getNewExpressionMetadata(expression as ts.NewExpression);
    case ts.SyntaxKind.PropertyAccessExpression:
      return getPropertyAccessExpressionMetadata(expression as ts.PropertyAccessExpression);
    case ts.SyntaxKind.StringLiteral:
      return getStringLiteralMetadata(expression);
    case ts.SyntaxKind.TrueKeyword:
      return getTrueKeywordMetadata();
    default:
      console.error(
        chalk.yellow('Unhandled expression kind'),
        chalk.bgRed.white(ts.SyntaxKind[expression.kind]),
        chalk.bgBlue.white(expression.getFullText())
      );
      break;
  }

  return {
    type: BasicType.Unknown,
    args: [],
    literal: expression.getText(),
  } as IType;
};

// TODO (ryan): Finish this...
const getCallExpressionMetadata = (expression: ts.CallExpression): ICallExpression => {
  return {
    expressionType: ExpressionMetadataType.Call,
    expression: collectExpressionMetadata(expression.expression),
    args: [], // TODO (ryan): Implement this.
  };
};

const getFalseKeywordMetadata = (): IType => {
  return {
    type: BasicType.Boolean,
    literal: false,
  };
};

/**
 * TODO (ryan): Drop identifier in CallExpression so that ClassName
 *   is the identifier of the type!
  
  "initializer": {
    "expressionType": "new",
    "identifier": "EventEmitter",
    "type": {
      "type": "[unknown]",
      "args": [
        {
          "type": "MatSelectionListChange",
          "args": []
        }
      ]
    },
    "args": []
  }
 */

const getNewExpressionMetadata = (expression: ts.NewExpression): INewExpression => {
  const newExp = expression;
  const identifier = getExpressionIdentifier(newExp);
  let args: ExpressionMetadata[] = [];
  // TODO (ryan): Generalize this for CallExpression!
  if (newExp.arguments) {
    args = newExp.arguments.map((node: ts.Expression) => collectExpressionMetadata(node));
  }
  return {
    expressionType: ExpressionMetadataType.New,
    identifier,
    type: getTypeCompositionFromNode((expression as unknown) as ts.TypeNode),
    args,
  };
};

const getPropertyAccessExpressionMetadata = (
  expression: ts.PropertyAccessExpression
): IPropertyAccessExpression => {
  const identifier = getExpressionIdentifier(expression);
  const name = expression.name.escapedText;
  return {
    expressionType: ExpressionMetadataType.PropertyAccess,
    identifier,
    name,
  } as IPropertyAccessExpression;
};

const getStringLiteralMetadata = (expression: ts.Expression): IType => {
  return {
    type: BasicType.String,
    literal: expression.getText(),
  } as IType;
};

const getTrueKeywordMetadata = (): IType => {
  return {
    type: BasicType.Boolean,
    literal: true,
  };
};
