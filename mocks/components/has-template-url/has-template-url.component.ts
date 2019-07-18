import { Component } from '@angular/core';

@Component({
  selector: 'has-template-url',
  templateUrl: './template.html',
  styles: [
    `
      .some-selector {
        color: blue;
      }
    `,
  ],
})
export class HasTemplateUrlComponent {}
