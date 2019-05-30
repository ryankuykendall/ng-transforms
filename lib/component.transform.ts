import ts, { ImportSpecifier, createNodeArray, createStatement, isObjectLiteralExpression } from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';

/* Helpers 
   TODO: Move these into a separate library (will want to create more of these.)
*/
const objectLiteralKeys = (obj: ts.ObjectLiteralExpression):string[] => {
  return obj.properties.map(prop => (prop.name as ts.Identifier).escapedText as string);
};

const objectLiteralRemoveProperty = (props: ts.ObjectLiteralElementLike[], key: string):ts.ObjectLiteralElementLike[] => {
  return props.filter(prop => {
    return (prop.name as ts.Identifier).escapedText as string !== key;
  });
};

/* Basic Example */
function simpleTransformer<T extends ts.Node>(): ts.TransformerFactory<T> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      if (ts.isDecorator(node)) {
        return undefined;
      }
      return ts.visitEachChild(node, (child) => visit(child), context);
    };

    return (node) => ts.visitNode(node, visit);
  };
}

/* Complex Example */
function complexTransformer<T extends ts.Node>(): ts.TransformerFactory<T> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      if (ts.isClassDeclaration(node) && node.decorators && node.name) {
        const decorator = node.decorators.find((decorator) => {
          const decoratorExpr = decorator.expression;
      
          return ts.isCallExpression(decoratorExpr) &&
            decoratorExpr.expression.getText() === 'customElement';
        });
      
        if (decorator) {
          node.decorators = ts.createNodeArray(
            node.decorators.filter((d) => d !== decorator)
          );

          const name = (decorator.expression as ts.CallExpression).arguments[0];
          const defineCall = ts.createStatement(ts.createCall(
            ts.createPropertyAccess(
              ts.createIdentifier('customElements'),
              ts.createIdentifier('define')
            ), undefined, [name, node.name]));
        
          return [node, defineCall];
        }
      
        return node;
      }
    };

    return (node) => ts.visitNode(node, visit);
  };
}

const ANGULAR_CORE_MODULE_SPECIFIER = `'@angular/core'`;
// Question on these: Should I just be importing these directly?
const ANGULAR_CORE_MODULE_VIEW_ENCAPSULATION_ENUM = 'ViewEncapsulation';
const ANGULAR_CORE_MODULE_VIEW_ENCAPSULATION_ENUM_VALUE_SHADOW_DOM = 'ShadowDom';
const ANGULAR_COMPONENT_DECORATOR_ENCAPSULATION_PROPERTY_NAME =  'encapsulation';

// TODO: Ensure that ViewEncapsulation is not already imported before mutating
export function importViewEncapsulationFromAngularCoreTransformer<T extends ts.Node>(): ts.TransformerFactory<T> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      let workingNode = node;

      if (ts.isImportDeclaration(node) &&
        node.moduleSpecifier.getFullText().trim() == ANGULAR_CORE_MODULE_SPECIFIER) {
        workingNode = ts.getMutableClone(node);
        const importClause = (workingNode as ts.ImportDeclaration).importClause;
        if (importClause && ts.isImportClause(importClause)) {
          const namedImports = importClause.namedBindings as ts.NamedImports;
        
          if (namedImports && ts.isNamedImports(namedImports)) {
            const allImportSpecifiers = namedImports.elements.
            map(child => child.name.escapedText as string);
            
            if (!allImportSpecifiers.includes(
                ANGULAR_CORE_MODULE_VIEW_ENCAPSULATION_ENUM)) {
              const veImportSpecifier = ts.createImportSpecifier(
                undefined, /** For casting using 'as' */
                ts.createIdentifier(ANGULAR_CORE_MODULE_VIEW_ENCAPSULATION_ENUM)
              );
  
              importClause.namedBindings = ts.createNamedImports(
                [...(Array.from(namedImports.elements) as ts.ImportSpecifier[]), 
                veImportSpecifier] as ReadonlyArray<ts.ImportSpecifier>);
            }
          }
        }
      }
        
      // Make sure we continue to traverse through the AST
      return ts.visitEachChild(workingNode, (child) => visit(child), context);
    };

    return (node) => ts.visitNode(node, visit);
  };
};

// TODO: Ensure that ViewEncapsulation is not already set in the Component decorator.
export function addViewEncapsulationShadowDomToComponentDecoratorTransformer<T extends ts.Node>(): ts.TransformerFactory<T> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      let workingNode = node;

      if (ts.isDecorator(node) && ts.isClassDeclaration(node.parent)) {
        workingNode = ts.getMutableClone(node);
        const callExpression = (workingNode as ts.Decorator).expression as ts.CallExpression;
        const identifier = callExpression.expression;
        const [objLiteralExpression] = callExpression.arguments;

        if (identifier && 
            ts.isIdentifier(identifier) &&
            identifier.escapedText === 'Component' && 
            ts.isObjectLiteralExpression(objLiteralExpression)) {

          const statement = 
            ts.createPropertyAccess(
              ts.createIdentifier('ViewEncapsulation'),
              ts.createIdentifier('ShadowDom')
            );

          const encapsulationProperty = ts.createPropertyAssignment(
            ANGULAR_COMPONENT_DECORATOR_ENCAPSULATION_PROPERTY_NAME, statement);
          const propertyKeys = objectLiteralKeys(objLiteralExpression);
          let properties = [...Array.from(objLiteralExpression.properties)];

          // If encapsulation is already set in the decorator, remove it.
          if (propertyKeys.includes(ANGULAR_COMPONENT_DECORATOR_ENCAPSULATION_PROPERTY_NAME)) {
            properties = objectLiteralRemoveProperty(properties, 
              ANGULAR_COMPONENT_DECORATOR_ENCAPSULATION_PROPERTY_NAME);
          }

          // Set the new encapsulation property.
          properties.push(encapsulationProperty);

          callExpression.arguments = ts.createNodeArray(
              [ts.createObjectLiteral(properties as ReadonlyArray<ts.ObjectLiteralElementLike>)],
              true
            );
        }
      }

      return ts.visitEachChild(workingNode, (child) => visit(child), context);
    };

    return (node) => ts.visitNode(node, visit);
  };
};