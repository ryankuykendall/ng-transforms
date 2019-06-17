@SomeDecorator()
export class BasicClass extends Foo implements Bar {
  public someStringProp: string = 'test-string';
  private _somePrivateNumberProp: number = 0;
  protected _someProtectedBooleanProp: boolean = false;
  private readonly _PrivateReadonlyBooleanProp: boolean = true;

  get numberProp(): number {
    return this._somePrivateNumberProp;
  }
  set numberProp(val: number) {
    this._somePrivateNumberProp = val;
  }

  constructor(private someBooleanProp: boolean) {
    super();
  }

  getStringProp(): string {
    return this.someStringProp;
  }

  someFunc = function(arg1: boolean, arg2: string): number {
    if (arg1 && arg2.length > 4) {
      return 5;
    }
    return this._somePrivateNumberProp;
  };

  someArrayFunc = (arg1: boolean, arg2: string): number => {
    if (arg1 && arg2.length > 4) {
      return 5;
    }
    return this._somePrivateNumberProp;
  };
}
