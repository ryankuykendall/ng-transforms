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

export const getPropertyAsGetFullText = (
  props: ts.ObjectLiteralElementLike[],
  key: string
): string | undefined => {
  const propAssignment = __getProperty(props, key);
  if (propAssignment && ts.isPropertyAssignment(propAssignment)) {
    return propAssignment.getFullText();
  }

  return;
};

export const getPropertyAsBoolean = (
  props: ts.ObjectLiteralElementLike[],
  key: string
): boolean | undefined => {
  const propAssignment = __getProperty(props, key);
  if (propAssignment && ts.isPropertyAssignment(propAssignment)) {
    const initializer = propAssignment.initializer;
    const assignment: string = initializer.getText().trim();
    if (assignment === 'true') return true;
    if (assignment === 'false') return false;
  }

  return;
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

// TODO (ryan): This should return undefined if it cannot be found for consistency.
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

export const getPropertyAsExpression = (
  props: ts.ObjectLiteralElementLike[],
  key: string
): ts.Expression | undefined => {
  let propAssignment = __getProperty(props, key);

  if (propAssignment && ts.isPropertyAssignment(propAssignment)) {
    propAssignment = propAssignment as ts.PropertyAssignment;
    return propAssignment.initializer;
  }

  return;
};

export const getObjectLiteralPropertiesAsMap = <T extends string>(
  objectLiteral: ts.ObjectLiteralExpression
): Map<T, ts.Expression> => {
  const properties: Map<T, ts.Expression> = new Map();
  objectLiteral.properties.forEach((prop: ts.ObjectLiteralElementLike) => {
    if (ts.isPropertyAssignment(prop)) {
      const paProp = prop as ts.PropertyAssignment;
      const key = paProp.name.getText();
      const value = paProp.initializer;
      properties.set(key as T, value);
    }
  });

  return properties;
};

export const mapPropertyNamesToObjectLiteralElementLikes = <T extends string>(
  objectLiteral: ts.ObjectLiteralExpression
): Map<T, ts.ObjectLiteralElementLike> => {
  return objectLiteral.properties.reduce(
    (propertyMap: Map<T, ts.ObjectLiteralElementLike>, property: ts.ObjectLiteralElementLike) => {
      if (ts.isPropertyAssignment(property)) {
        const paProp = property as ts.PropertyAssignment;
        const key = paProp.name.getText();
        propertyMap.set(key as T, property);
      }
      return propertyMap;
    },
    new Map<T, ts.ObjectLiteralElementLike>()
  );
};
