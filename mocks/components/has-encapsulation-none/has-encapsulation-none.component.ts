import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'has-encapsulation-none',
  template: `
    <main></main>
  `,
  styles: [
    `
      .some-selector {
        color: blue;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
})
export class HasEncapsulationNoneComponent {}
