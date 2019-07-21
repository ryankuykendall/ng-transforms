import ts from 'typescript';
import * as strLitUtil from './string-literal.util';

export const keys = (obj: ts.ObjectLiteralExpression): string[] => {
  return obj.properties.map(prop => (prop.name as ts.Identifier).escapedText as string);
};

export const hasKey = (obj: ts.ObjectLiteralExpression, key: string): boolean => {
  return keys(obj).includes(key);
};

export const removeProperty = (
  props: ts.ObjectLiteralElementLike[],
  key: string
): ts.ObjectLiteralElementLike[] => {
  return props.filter(prop => {
    return ((prop.name as ts.Identifier).escapedText as string) !== key;
  });
};

const __getProperty = (
  props: ts.ObjectLiteralElementLike[],
  key: string
): ts.PropertyAssignment | undefined => {
  const propAssignment = props.find(prop => {
    return ((prop.name as ts.Identifier).escapedText as string) === key;
  });

  if (propAssignment && ts.isPropertyAssignment(propAssignment)) {
    return propAssignment as ts.PropertyAssignment;
  }

  return undefined;
};

export const getPropertyAsPropertyAssignment = (
  props: ts.ObjectLiteralElementLike[],
  key: string
): ts.PropertyAssignment | undefined => {
  return __getProperty(props, key);
};

export const getPropertyAsString = (
  props: ts.ObjectLiteralElementLike[],
  key: string,
  stripQuotes: boolean = false
): string | null => {
  const propAssignment = __getProperty(props, key);

  if (propAssignment && ts.isPropertyAssignment(propAssignment)) {
    const initializer = propAssignment.initializer;

    if (stripQuotes) {
      return strLitUtil.stripQuotes(initializer);
    }

    return initializer.getText() as string;
  }

  return null;
};

export const getPropertyAsArrayLiteralExpression = (
  props: ts.ObjectLiteralElementLike[],
  key: string
): ts.ArrayLiteralExpression | null => {
  let propAssignment = __getProperty(props, key);

  if (propAssignment && ts.isPropertyAssignment(propAssignment)) {
    propAssignment = propAssignment as ts.PropertyAssignment;
    const arrayLitExp = propAssignment.getChildren().find((child: ts.Node) => {
      return child && ts.isArrayLiteralExpression(child);
    });

    if (arrayLitExp && ts.isArrayLiteralExpression(arrayLitExp)) {
      return arrayLitExp as ts.ArrayLiteralExpression;
    }
  }

  return null;
};
