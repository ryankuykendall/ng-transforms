import { IType } from './type.interface';
import { IHasIdentifier } from './base.interface';

export const enum ExpressionMetadataType {
  New = 'new',
  Call = 'call',
  PropertyAccess = 'property-access',
}

export interface IHasExpressionMetadataType {
  expressionType: ExpressionMetadataType;
}

export interface INewExpression extends IHasExpressionMetadataType {
  type: IType;
  args: ExpressionMetadata[];
}

export interface ICallExpression extends IHasExpressionMetadataType {
  args: string[]; // Placeholder...Finish this...
  expression: ExpressionMetadata;
}

export interface IPropertyAccessExpression extends IHasIdentifier, IHasExpressionMetadataType {
  name: string;
}

export type ExpressionMetadata =
  | IType
  | ICallExpression
  | INewExpression
  | IPropertyAccessExpression;
