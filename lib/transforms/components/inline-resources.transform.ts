import ts from 'typescript';
import path from 'path';

// CLEANUP (ryan): Create shorthand versions of these since they are
//   namespaced: IRef, IModel, IBuild, ITransformBundle
import {
  IComponentDecoratorRef,
  IComponentInlineModel,
  IComponentInlineBuild,
  IComponentInlineTransformBundle,
} from './inline-resources.interface';

import * as decIdsUtil from './../../utils/decorator-identifier.util';
import { Property as cdProperty } from './../../declaration-metadata/component.decorator-property';

const withComponentDecoratorConfiguration = (
  workingNode: ts.Node,
  callback: (callExp: ts.CallExpression, objLitExp: ts.ObjectLiteralExpression) => void
) => {
  if (ts.isDecorator(workingNode) && ts.isClassDeclaration(workingNode.parent)) {
    workingNode = ts.getMutableClone(workingNode);
    const callExpression = (workingNode as ts.Decorator).expression as ts.CallExpression;
    const identifier = callExpression.expression;
    const [objLiteralExpression] = callExpression.arguments;

    if (
      identifier &&
      ts.isIdentifier(identifier) &&
      identifier.escapedText === decIdsUtil.COMPONENT &&
      ts.isObjectLiteralExpression(objLiteralExpression)
    ) {
      // Process the contents of the object literal.
      callback.call(
        null,
        callExpression as ts.CallExpression,
        objLiteralExpression as ts.ObjectLiteralExpression
      );
    }
  }
};

export const inlineResources = (
  callExp: ts.CallExpression,
  objLitExp: ts.ObjectLiteralExpression,
  models: IComponentInlineModel[]
) => {
  // Find the matching model for this node
  const model: IComponentInlineModel | undefined = models.find((model: IComponentInlineModel) => {
    return model.callExpression === callExp && model.objectLiteralExpression === objLitExp;
  });

  if (model) {
    const updatedOLEProperties: ts.ObjectLiteralElementLike[] = [];
    model.objectLiteralExpression.properties.forEach((element: ts.ObjectLiteralElementLike) => {
      if (element.name) {
        const propertyName = element.name.getText();
        switch (propertyName) {
          case cdProperty.Template:
            // Template already existed in decorator, so just add it to the new OLE.
            if (!model.hasTemplateUrl) {
              updatedOLEProperties.push(element);
            }
            break;
          case cdProperty.Styles:
            // Styles already existed in decorator, so just add them to the new OLE.
            if (!model.hasStyleUrls) {
              updatedOLEProperties.push(element);
            }
            break;
          case cdProperty.TemplateUrl:
            if (model.hasTemplateUrl && model.template) {
              const templateProperty = ts.createPropertyAssignment(
                ts.createStringLiteral(cdProperty.Template),
                ts.createNoSubstitutionTemplateLiteral(model.template)
              );
              updatedOLEProperties.push(templateProperty);
            } else {
              updatedOLEProperties.push(element);
            }
            break;
          case cdProperty.StyleUrls:
            if (model.hasStyleUrls && model.styles) {
              const styleItems = model.styles.map(
                (style: string): ts.NoSubstitutionTemplateLiteral => {
                  return ts.createNoSubstitutionTemplateLiteral(style);
                }
              );
              const stylesProperty = ts.createPropertyAssignment(
                ts.createIdentifier(cdProperty.Styles),
                ts.createArrayLiteral(styleItems, false)
              );
              updatedOLEProperties.push(stylesProperty);
            }
            break;
          default:
            updatedOLEProperties.push(element);
            break;
        }
      }
    });

    // TODO (ryan): Really have to use the visitor pattern to reliably execute
    //   the transform...
    // const updatedOLE: ts.ObjectLiteralExpression = ts.createObjectLiteral(updatedOLEProperties);
    // const callExpression = ts.getMutableClone(model.callExpression);
    callExp.arguments = ts.createNodeArray(
      [ts.createObjectLiteral(updatedOLEProperties as ReadonlyArray<ts.ObjectLiteralElementLike>)],
      true
    );

    // updatedOLE;
    // model.callExpression = callExpression;
    // model.callExpression.expression = updatedOLE;
  }
};

export function transform<T extends ts.Node>(
  models: IComponentInlineModel[]
): ts.TransformerFactory<T> {
  return context => {
    const visit: ts.Visitor = node => {
      let workingNode = node;

      withComponentDecoratorConfiguration(workingNode, (callExp, objLitExp) => {
        inlineResources(callExp, objLitExp, models);
      });

      return ts.visitEachChild(workingNode, child => visit(child), context);
    };

    return node => ts.visitNode(node, visit);
  };
}

export const invoke = (
  bundle: IComponentInlineTransformBundle
): ts.TransformationResult<ts.SourceFile> => {
  return ts.transform(bundle.sourceFile, [transform(bundle.models)]) as ts.TransformationResult<
    ts.SourceFile
  >;
};
