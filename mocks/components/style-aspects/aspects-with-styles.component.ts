import { Component } from '@angular/core';

@Component({
  selector: 'aspect-with-styles',
  template: `
    <main><h1>Aspect With Styles Component</h1></main>
  `,
  styles: [
    `
      :host {
        box-sizing: border-box;
      }
    `,
  ],
})
export class AspectsWithStylesComponent {}
