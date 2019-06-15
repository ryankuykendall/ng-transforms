type TestType = string;
enum EnumType {
  First,
  Second,
}

export interface InterfaceExample {
  someStr: string;
  someNumber: number;
  someStrCollection: string[];
  someOptionalBoolean?: boolean;

  someFunc1?: () => number;
  someFunc2: (arg1: string) => number;
  someFunc3: (arg1: string, arg2: boolean) => number[];
  someFunc4Enum: (arg1: string, arg2: boolean) => EnumType[];
  someFunc5ComplexReturn: () => Map<TestType, Set<EnumType[]>>[];
  someFunc6WithNestedTypeArgs: (arg1: Map<TestType, Set<TestType>>) => Set<TestType>[];

  otherFunc1(): number;
  otherFunc2(arg1: string): number;
  // // TODO (ryan): FIGURE OUT HANDLING ARRAY TYPE NODES!!!
  otherFunc3(arg1: string, arg2: boolean): number[];
  otherFunc4Enum(arg1: string, arg2: boolean): EnumType[];
  otherFunc5ComplexReturn(): Map<TestType, Set<EnumType[]>>[];
  otherFunc6WithNestedTypeArgs(arg1: Map<TestType, Set<TestType>>): Set<number>;

  nonBasicType1: TestType;
  someSet: Set<number>;
  someMap: Map<string, boolean>;
  someCollectionOfMaps: Map<string, boolean>[];
  someCollectionOfSets: Set<string>[];

  someNestedTypeArgMap: Map<string, Map<string, Set<number[]>>>;
}
