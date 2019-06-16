import ts from 'typescript';

export enum BasicType {
  Any = 'any',
  Boolean = 'boolean',
  Enum = 'enum',
  Function = 'function',
  Number = 'number',
  String = 'string',
  Unknown = '[unknown]',
  Void = 'void',
}

export enum ObjectType {
  Array = 'Array',
  Map = 'Map',
  Object = 'Object',
  Set = 'Set',
}

export enum ObservableType {
  Subject = 'Subject',
  BehaviorSubject = 'BehaviorSubject',
  ReplaySubject = 'ReplaySubject',
  AsyncSubject = 'AsyncSubject',
}

export type DataType = BasicType | ObjectType | ObservableType | string;

export const basicTypeMap: Map<ts.SyntaxKind, DataType> = new Map([
  [ts.SyntaxKind.BooleanKeyword, BasicType.Boolean],
  [ts.SyntaxKind.EnumKeyword, BasicType.Enum],
  [ts.SyntaxKind.NumberKeyword, BasicType.Number],
  [ts.SyntaxKind.StringKeyword, BasicType.String],
  [ts.SyntaxKind.FunctionType, BasicType.Function],
]);

export const objectTypeMap: Map<ts.SyntaxKind, ObjectType> = new Map([
  [ts.SyntaxKind.ArrayType, ObjectType.Array],
  [ts.SyntaxKind.TypeLiteral, ObjectType.Object],
]);

export type typeNodeHandlerFunc = (typeNode: ts.TypeNode) => DataType;
export const kindTypeReferenceNodeHandler = (typeNode: ts.TypeNode): DataType | string => {
  let type: DataType = BasicType.Unknown;
  if (ts.isTypeReferenceNode(typeNode)) {
    const typeName = (typeNode.typeName as ts.Identifier).escapedText as string;

    switch (typeName) {
      case 'Set':
        type = ObjectType.Set;
        break;
      case 'Map':
        type = ObjectType.Map;
        break;
      default:
        type = typeName;
        break;
    }
  }

  return type;
};

export const complexTypeMap: Map<ts.SyntaxKind, typeNodeHandlerFunc> = new Map([
  [ts.SyntaxKind.TypeReference, kindTypeReferenceNodeHandler],
]);

/** Include these with everything! */
interface HasIdentifier {
  identifier: string;
}

interface HasFilepath {
  filepath: string;
}

/** Arguments */
export interface ITypeArgument {
  type: DataType;
  typeArguments?: ITypeArgument[];
}

export interface IMethodParameter extends HasIdentifier, ITypeArgument {}

export interface IReturn extends ITypeArgument {}

export interface IMethodBase {
  parameters: IMethodParameter[];
  returns: IReturn;
}

export interface IMethodMetadata extends HasIdentifier, IMethodBase {}
export interface IFunctionMetadata extends IMethodMetadata {
  optional: boolean;
}

/** Classes */
export interface IClassMetadata extends HasIdentifier, HasFilepath {}

/** Components */
export interface IComponentMetadata extends HasIdentifier, HasFilepath {}

/** Directives */
export interface IDirectiveMetadata extends HasIdentifier, HasFilepath {}

/** Enums */
export enum EnumMemberType {
  Number = 'number',
  String = 'string',
}

export interface IEnumNumberMemberMetadata extends HasIdentifier {
  type: EnumMemberType;
  value: string;
}

export interface IEnumStringMemberMetadata extends HasIdentifier {
  type: EnumMemberType;
  value: string;
}

export type EnumMemberMetadataType = IEnumNumberMemberMetadata | IEnumStringMemberMetadata;

export interface IEnumMetadata extends HasIdentifier, HasFilepath {
  members: (IEnumNumberMemberMetadata | IEnumStringMemberMetadata)[];
}

/** Interfaces */
export interface IInterfacePropertyMetadata extends HasIdentifier {
  optional: boolean;
  type: DataType | string;
  typeArguments?: ITypeArgument[];
}

export interface IInterfaceMetadata extends HasIdentifier, HasFilepath {
  functions: IFunctionMetadata[];
  methods: IMethodMetadata[];
  properties: IInterfacePropertyMetadata[];
}

/** Modules */
export interface INgModuleMetadata extends HasIdentifier, HasFilepath {
  identifier: string;
  filepath: string;
}

// Instead of RootTypes, we should call these declarations
// QUESTION (ryan): Should we be capturing exported functions/methods
//   that are not defined in an interface or a class?
export enum RootType {
  classes = 'classes',
  components = 'components',
  directives = 'directives',
  enums = 'enums',
  interfaces = 'interfaces',
  modules = 'modules',
}

export interface INgInterfaceMetadataRoot {
  classes?: IClassMetadata[];
  components?: IComponentMetadata[];
  directives?: IDirectiveMetadata[];
  enums?: IEnumMetadata[];
  interfaces?: IInterfaceMetadata[];
  modules?: INgModuleMetadata[];
}

export type RootMetadataType =
  | IClassMetadata
  | IComponentMetadata
  | IDirectiveMetadata
  | IEnumMetadata
  | IInterfaceMetadata
  | INgModuleMetadata;

export type RootCollectorCallbackType = (
  root: INgInterfaceMetadataRoot,
  type: RootType,
  metadata: RootMetadataType
) => void;

export const rootCollectorCallback = (
  root: INgInterfaceMetadataRoot,
  type: RootType,
  metadata: RootMetadataType
) => {
  if (!root.hasOwnProperty(type)) {
    root[type] = [];
  }

  if (root[type]) {
    const collection = root[type] as Array<RootMetadataType>;
    collection.push(metadata);
  }
};
