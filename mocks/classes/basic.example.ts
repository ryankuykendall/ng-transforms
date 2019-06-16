@SomeDecorator()
export class BasicClass extends Foo implements Bar {
  public someStringProp: string = 'test-string';
  private _somePrivateNumberProp: number = 0;
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
}
