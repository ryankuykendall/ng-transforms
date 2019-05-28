import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  template: `<main></main>`,
  style: `.some-selector { color: blue; }`,
  encapsulation: ViewEncapsulation.None
})
export class HasEncapsulationNone {}