import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { CUSTOM_ELEMENTS_SCHEMA, Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { SomeComponent } from './some.component';

@NgModule({
  imports: [
    HttpClientModule,
    BrowserModule
  ],
  declarations: [
    SomeComponent,
  ],
  bootstrap: [],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  entryComponents: [
    SomeComponent
  ]
})
export class SomeComponentWebComponentModule {
  constructor(private injector: Injector) {}

  ngDoBootstrap() {
    const someComponentWC = createCustomElement(SomeComponent, { injector: this.injector });
    customElements.define('some-component', someComponentWC);
  }
}