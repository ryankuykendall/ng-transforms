import ts from 'typescript';
import * as idUtil from './../utils/identifier.util';
import {
  IClassMetadata,
  IGetAccessorMetadata,
  ISetAccessorMetadata,
  IFunctionMetadata,
  IMethodMetadata,
} from './class.interface';

export const collectClassMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IClassMetadata => {
  const identifier = idUtil.getName(node as idUtil.NameableProxy);

  const memberDistribution = distributeMembers(node);

  const functions = memberDistribution.functions.map(collectFunctionMetadata);
  const methods = memberDistribution.methods.map(collectMethodMetadata);
  const getters = memberDistribution.getAccessors.map(collectGetAccessorMetadata);
  const setters = memberDistribution.setAccessors.map(collectSetAccessorMetadata);

  return {
    identifier,
    filepath,
    functions,
    methods,
    getters,
    setters,
  };
};

interface IMemberDistribution {
  constructorNode?: ts.ConstructorTypeNode;
  properties: ts.PropertyDeclaration[];
  functions: ts.PropertyDeclaration[];
  methods: ts.MethodDeclaration[];
  getAccessors: ts.GetAccessorDeclaration[];
  setAccessors: ts.SetAccessorDeclaration[];
  unknownDistribution: string[];
}

const distributeMembers = (node: ts.ClassDeclaration): IMemberDistribution => {
  const distStub: IMemberDistribution = {
    properties: [],
    functions: [],
    methods: [],
    getAccessors: [],
    setAccessors: [],
    unknownDistribution: [],
  };
  const distribution: IMemberDistribution = node.members.reduce(
    (dist: IMemberDistribution, member: ts.ClassElement) => {
      if (ts.isConstructorTypeNode(member)) {
        dist.constructorNode = member;
      } else if (ts.isPropertyDeclaration(member)) {
        const propertyInitializer = member.initializer;
        if (
          propertyInitializer &&
          (ts.isArrowFunction(propertyInitializer) || ts.isFunctionExpression(propertyInitializer))
        ) {
          dist.functions.push(member);
        } else {
          dist.properties.push(member);
        }
      } else if (ts.isMethodDeclaration(member)) {
        dist.methods.push(member);
      } else if (ts.isGetAccessorDeclaration(member)) {
        dist.getAccessors.push(member);
      } else if (ts.isSetAccessor(member)) {
        dist.setAccessors.push(member);
      } else {
        dist.unknownDistribution.push(ts.SyntaxKind[member.kind]);
      }

      return dist;
    },
    distStub
  );

  return distribution;
};

const collectFunctionMetadata = (func: ts.PropertyDeclaration): IFunctionMetadata => {
  const identifier = idUtil.getName(func as idUtil.NameableProxy);
  return {
    identifier,
  };
};

const collectMethodMetadata = (method: ts.MethodDeclaration): IMethodMetadata => {
  const identifier = idUtil.getName(method as idUtil.NameableProxy);
  return {
    identifier,
  };
};

const collectGetAccessorMetadata = (accessor: ts.GetAccessorDeclaration): IGetAccessorMetadata => {
  const identifier = idUtil.getName(accessor as idUtil.NameableProxy);
  return {
    identifier,
  };
};

const collectSetAccessorMetadata = (accessor: ts.SetAccessorDeclaration): ISetAccessorMetadata => {
  const identifier = idUtil.getName(accessor as idUtil.NameableProxy);
  return {
    identifier,
  };
};
