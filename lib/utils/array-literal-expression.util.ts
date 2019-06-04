import ts from 'typescript';
import * as strLitUtil from './string-literal.util';

export const mapToArrayOfStrings = (arrayLitExp: ts.ArrayLiteralExpression) => {
  return arrayLitExp.elements.map((item: ts.Expression) => {
    return strLitUtil.stripQuotes(item as ts.StringLiteral);
  });
};