import { Component } from '@angular/core';

@Component({
  selector: 'complex-constructor',
})
export class ComplexConstructorComponent {
  constructor(
    elementRef: ElementRef,
    private _changeDetectorRef: ChangeDetectorRef,
    @Inject(MAT_TABS_CONFIG) @Optional() defaultConfig?: MatTabsConfig
  ) {
    super(elementRef);
    this._groupId = nextId++;
    this.animationDuration =
      defaultConfig && defaultConfig.animationDuration ? defaultConfig.animationDuration : '500ms';
  }
}
