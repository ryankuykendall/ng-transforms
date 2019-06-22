@SomeDecorator()
export class BasicClass extends Foo implements Bar, SomeInterface {
  public someStringProp: string = 'test-string';
  private _somePrivateNumberProp: number | undefined = 0;
  protected _someProtectedBooleanProp: boolean = false;
  private readonly _privateReadonlyBooleanProp: boolean = true;
  // NOTE (ryan): Does typescript have an API for inferring type?
  someCollectionOfNumbers = [1, 2, 3];

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

  public getNumberProp(): number | undefined {
    return this._somePrivateNumberProp;
  }

  private someFunc = function(arg1: boolean, arg2: string): number {
    if (arg1 && arg2.length > 4) {
      return 5;
    }
    return this._somePrivateNumberProp;
  };

  protected someArrayFunc = (arg1: boolean, arg2: string): number => {
    if (arg1 && arg2.length > 4) {
      return 5;
    }
    return this._somePrivateNumberProp;
  };
}
