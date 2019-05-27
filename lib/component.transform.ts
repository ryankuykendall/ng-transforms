import ts, { ImportSpecifier, createNodeArray, createStatement } from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';

export function importViewEncapsulationFromAngularCore<T extends ts.Node>(): ts.TransformerFactory<T> {
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

export function importViewEncapsulationFromAngularCoreTransformer<T extends ts.Node>(): ts.TransformerFactory<T> {
  return (context) => {
    const visit: ts.Visitor = (node) => {
      let workingNode = node;

      if (ts.isImportDeclaration(node) &&
        node.moduleSpecifier.getFullText().trim() == ANGULAR_CORE_MODULE_SPECIFIER) {
        const workingNode = ts.getMutableClone(node) as ts.ImportDeclaration;
        const importClause = workingNode.importClause;
        if (importClause && ts.isImportClause(importClause)) {
          const namedImports = importClause.namedBindings as ts.NamedImports;
          if (namedImports && ts.isNamedImports(namedImports)) {
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
        
      // Make sure we continue to traverse through the AST
      return ts.visitEachChild(workingNode, (child) => visit(child), context);
    };

    return (node) => ts.visitNode(node, visit);
  };
};

export function addViewEncapsulationToComponentDecoratorTransformer<T extends ts.Node>(): ts.TransformerFactory<T> {
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

          const encapsulationProperty = ts.createPropertyAssignment('encapsulation', statement);
          const properties = [...Array.from(objLiteralExpression.properties), encapsulationProperty];

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