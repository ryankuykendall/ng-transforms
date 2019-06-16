@SomeDecorator()
export class BasicClass extends Foo implements Bar {
  public someStringProp: string = 'test-string';

  constructor(private someBooleanProp: boolean) {
    super();
  }

  getStringProp(): string {
    return this.someStringProp;
  }
}
