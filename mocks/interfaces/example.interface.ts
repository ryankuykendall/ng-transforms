type TestType = string;

export interface InterfaceExample {
  /** Whether the browser should scroll to the element when it is focused. */
  preventScroll?: boolean;

  someStr: string;
  someNumber: number;
  someStrCollection: string[];
  someFunc1?: () => number;
  someFunc2: (arg1: string) => string;
  someFunc3: (arg1: string, arg2: string) => string;

  otherFunc1(): number;
  otherFunc2(arg1: string): string;
  otherFunc3(arg1: string, arg2: string): string[];

  nonBasicType1: TestType;
  someSet: Set<number>;
  someMap: Map<string, boolean>;

  someNestedTypeArgMap: Map<string, Map<string, Set<number[]>>>;
}
