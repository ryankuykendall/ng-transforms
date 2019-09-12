import ts, { TsConfigSourceFile } from 'typescript';
import { IType, ITypeMember } from './type.interface';
import { BasicType, DataType, ObjectType } from './base.metadata';
import chalk from 'chalk';
import {
  INewExpression,
  ExpressionMetadata,
  ExpressionMetadataType,
  IPropertyAccessExpression,
  ICallExpression,
} from './expression.interface';
import { getExpressionIdentifier, getName, INameableProxy } from '../utils/identifier.util';
import { collectTypeArgumentMetadata } from './type.metadata';
import { getPropertyAsExpression } from '../utils/object-literal-expression.util';
import logger from '../utils/logger.util';

// TODO (ryan): Break each case into a separate method.
export const collectExpressionMetadata = (
  expression:
    | ts.Expression
    | ts.LeftHandSideExpression /** TODO (ryan): Create type alias for this? */
): ExpressionMetadata => {
  switch (expression.kind) {
    // Keep the cases sorted by SyntaxKind!
    case ts.SyntaxKind.ArrayLiteralExpression:
      return getArrayLiteralExpressionMetadata(expression as ts.ArrayLiteralExpression);
    case ts.SyntaxKind.AsExpression:
      return getAsExpressionMetadata(expression as ts.AsExpression);
    case ts.SyntaxKind.CallExpression:
      return getCallExpressionMetadata(expression as ts.CallExpression);
    case ts.SyntaxKind.FalseKeyword:
      return getFalseKeywordMetadata();
    case ts.SyntaxKind.FirstLiteralToken:
      return getFirstLiteralTokenMetadata(expression);
    case ts.SyntaxKind.Identifier:
      return getIdentifierMetadata(expression as ts.Identifier);
    case ts.SyntaxKind.NewExpression:
      return getNewExpressionMetadata(expression as ts.NewExpression);
    case ts.SyntaxKind.NullKeyword:
      return getNullKeywordMetadata();
    case ts.SyntaxKind.ObjectLiteralExpression:
      return getObjectLiteralExpressionMetadata(expression as ts.ObjectLiteralExpression);
    case ts.SyntaxKind.PropertyAccessExpression:
      return getPropertyAccessExpressionMetadata(expression as ts.PropertyAccessExpression);
    case ts.SyntaxKind.StringLiteral:
      return getStringLiteralMetadata(expression);
    case ts.SyntaxKind.TemplateExpression:
      return getTemplateExpressionMetadata(expression as ts.TemplateExpression);
    case ts.SyntaxKind.ThisKeyword:
      return getThisKeywordMetadata();
    case ts.SyntaxKind.TrueKeyword:
      return getTrueKeywordMetadata();
    default:
      logger.error(
        'Unhandled expression kind',
        chalk.bgRed.white(ts.SyntaxKind[expression.kind]),
        chalk.bgBlue.white(expression.getFullText())
      );
      break;
  }

  return {
    type: `${BasicType.Unknown}: ${ts.SyntaxKind[expression.kind]}`,
    args: [],
    literal: expression.getText(),
  } as IType;
};

const getArrayLiteralExpressionMetadata = (expression: ts.ArrayLiteralExpression): IType => {
  const members: ITypeMember[] = expression.elements.map(
    (element: ts.Expression): ITypeMember => {
      return {
        value: collectExpressionMetadata(element),
      };
    }
  );

  return {
    type: ObjectType.Array,
    members,
  };
};

const getAsExpressionMetadata = (expression: ts.AsExpression): IType => {
  // TODO (ryan): Finish this...example of what needs to be handled is here:
  /**
   {
      provide: MAT_CHIPS_DEFAULT_OPTIONS,
      useValue: {
        separatorKeyCodes: [ENTER]
      } as MatChipsDefaultOptions
    }
   * 
   */
  return {
    type: BasicType.CastAs,
    literal: expression.getText(),
  };
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

const getFirstLiteralTokenMetadata = (expression: ts.Expression): IType => {
  return {
    type: BasicType.Number,
    literal: parseInt(expression.getText(), 10),
  };
};

const getIdentifierMetadata = (identifier: ts.Identifier): IType => {
  return {
    type: identifier.getText().trim(),
  };
};

const getNewExpressionMetadata = (expression: ts.NewExpression): INewExpression => {
  let args: ExpressionMetadata[] = [];
  // TODO (ryan): Generalize this for CallExpression!
  if (expression.arguments) {
    args = expression.arguments.map((node: ts.Expression) => collectExpressionMetadata(node));
  }

  let dataType: DataType = BasicType.Unknown;
  switch (expression.expression.kind) {
    case ts.SyntaxKind.Identifier:
      dataType = (expression.expression as ts.Identifier).getText();
      break;
  }
  let typeArgs: ts.TypeNode[] = [];
  if (expression.typeArguments) {
    typeArgs = expression.typeArguments.map(arg => arg);
  }
  const type: IType = {
    type: dataType,
    args: collectTypeArgumentMetadata(expression, typeArgs),
  };

  return {
    expressionType: ExpressionMetadataType.New,
    type,
    args,
  };
};

const getNullKeywordMetadata = (): IType => {
  return {
    type: BasicType.Null,
  };
};

const getObjectLiteralExpressionMetadata = (expression: ts.ObjectLiteralExpression): IType => {
  const members: ITypeMember[] = [];
  expression.properties.forEach((property: ts.ObjectLiteralElementLike) => {
    if (ts.isPropertyAssignment(property)) {
      const key: IType = {
        type: BasicType.String,
        literal: property.name.getText(),
      };
      const value = collectExpressionMetadata(property.initializer);
      members.push({
        key,
        value,
      });
    } else {
      console.warn('Unhandled ts.ObjectExpressionLiteralLike', property.getText());
    }
  });

  return {
    type: ObjectType.Object,
    members,
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

const getTemplateExpressionMetadata = (expression: ts.TemplateExpression): IType => {
  return {
    type: BasicType.Template,
    literal: expression.getText(),
  } as IType;
};

const getThisKeywordMetadata = (): IType => {
  return {
    type: BasicType.ThisKeyword,
  } as IType;
};

const getTrueKeywordMetadata = (): IType => {
  return {
    type: BasicType.Boolean,
    literal: true,
  };
};
