import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'has-encapsulation-none',
  template: `<main></main>`,
  style: `.some-selector { color: blue; }`,
  encapsulation: ViewEncapsulation.None
})
export class HasEncapsulationNoneComponent {}