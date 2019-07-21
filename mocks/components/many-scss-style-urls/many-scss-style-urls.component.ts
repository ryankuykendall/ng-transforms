import { Component } from '@angular/core';

@Component({
  selector: 'scss-style-url',
  templateUrl: 'many-scss-style-urls.component.html',
  styleUrls: [
    // Mix-up file names with './' at the beginning to ensure that they
    //   are resolved correctly.
    './many-scss-style-urls-reset.component.scss',
    'many-scss-style-urls.component.scss',
    './many-scss-style-urls-overrides.component.scss',
  ],
})
export class ManySCSSStyleUrlComponent {}
