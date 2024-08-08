import { ChangeDetectionStrategy, Component, TemplateRef } from '@angular/core';
import { AnchorConfiguration, injectAnchors } from '@snippets/anchors/anchors.utils';

@Component({
  selector: 'snip-anchors',
  standalone: true,
  imports: [],
  templateUrl: './anchors.component.html',
  styleUrl: './anchors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AnchorsComponent {
  anchors = injectAnchors();
  data = JSON.stringify({ some: 'data' });

  openBound(
    anchor: HTMLElement,
    template?: TemplateRef<any>,
    anchoring: AnchorConfiguration<any>['anchoring'] = 'auto',
  ) {
    this.anchors.anchorTo(anchor, template ?? null!, { data: this.data, anchoring });
  }

  getPosition(...selects: HTMLSelectElement[]): AnchorConfiguration<any>['anchoring'] {
    return `anchor ${selects[0].value} ${selects[1].value} to ${selects[2].value} ${selects[3].value}` as any;
  }
}
