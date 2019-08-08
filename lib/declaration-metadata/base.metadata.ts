import ts from 'typescript';
import chalk from 'chalk';

export enum BasicType {
  Any = 'any',
  Boolean = 'boolean',
  CastAs = 'cast-as',
  Enum = 'enum',
  Function = 'function',
  Intersection = 'intersection',
  Literal = 'literal',
  Null = 'null',
  Number = 'number',
  Parenthesized = 'parenthesized',
  String = 'string',
  Undefined = 'undefined',
  Union = 'union',
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
  [ts.SyntaxKind.AnyKeyword, BasicType.Any],
  [ts.SyntaxKind.BooleanKeyword, BasicType.Boolean],
  [ts.SyntaxKind.EnumKeyword, BasicType.Enum],
  [ts.SyntaxKind.FunctionType, BasicType.Function],
  [ts.SyntaxKind.IntersectionType, BasicType.Intersection],
  [ts.SyntaxKind.LiteralType, BasicType.Literal],
  [ts.SyntaxKind.NullKeyword, BasicType.Null],
  [ts.SyntaxKind.NumberKeyword, BasicType.Number],
  [ts.SyntaxKind.ParenthesizedType, BasicType.Parenthesized],
  [ts.SyntaxKind.StringKeyword, BasicType.String],
  [ts.SyntaxKind.UndefinedKeyword, BasicType.Undefined],
  [ts.SyntaxKind.UnionType, BasicType.Union],
  [ts.SyntaxKind.VoidKeyword, BasicType.Void],
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

export enum MemberModifier {
  Export = 'export',
  Public = 'public',
  Protected = 'protected',
  Private = 'private',
  Readonly = 'readonly',
  Static = 'static',
}

export const collectMemberModifiers = (node: ts.Node): MemberModifier[] | undefined => {
  if (node.modifiers) {
    const modifiers: MemberModifier[] = [];
    node.modifiers.forEach((mod: ts.Modifier) => {
      switch (mod.kind) {
        case ts.SyntaxKind.ExportKeyword:
          modifiers.push(MemberModifier.Export);
          break;
        case ts.SyntaxKind.PublicKeyword:
          modifiers.push(MemberModifier.Public);
          break;
        case ts.SyntaxKind.ProtectedKeyword:
          modifiers.push(MemberModifier.Protected);
          break;
        case ts.SyntaxKind.PrivateKeyword:
          modifiers.push(MemberModifier.Private);
          break;
        case ts.SyntaxKind.ReadonlyKeyword:
          modifiers.push(MemberModifier.Readonly);
          break;
        case ts.SyntaxKind.StaticKeyword:
          modifiers.push(MemberModifier.Static);
          break;
        default:
          console.error(
            chalk.yellowBright('Unrecognized member modifier'),
            chalk.bgRed.white(ts.SyntaxKind[mod.kind])
          );
          break;
      }
    });
    return modifiers;
  }

  return;
};
