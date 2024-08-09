import { ChangeDetectionStrategy, Component, ElementRef, inject, TemplateRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AnchorConfiguration,
  AnchoringPositionsX,
  AnchoringPositionsY,
  withAnchors,
} from '@snippets/overlays/anchors.overlays';
import { OVERLAY_CLOSER, OVERLAY_DATA, provideOverlays } from '@snippets/overlays/overlays.common';

@Component({
  selector: 'snip-anchors',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './anchors.component.html',
  styleUrl: './anchors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class AnchorsComponent {
  anchors = provideOverlays(withAnchors());

  config: AnchorConfiguration<any> = {
    anchoring: 'auto',
    capturePointer: false,
    data: 'Some random data',
  };

  position = {
    AY: 'top' as AnchoringPositionsY,
    TY: 'bottom' as AnchoringPositionsY,
    AX: 'left' as AnchoringPositionsX,
    TX: 'left' as AnchoringPositionsX,
  };

  useAuto = false;

  template = viewChild<TemplateRef<any>>('tpl');
  target = viewChild<ElementRef<HTMLElement>>('target');

  anchor(useTemplate = false) {
    const position: AnchorConfiguration<any>['anchoring'] = this.useAuto
      ? 'auto'
      : `anchor ${this.position.AY} ${this.position.AX} to ${this.position.TY} ${this.position.TX}`;
    const portal = useTemplate ? this.template()! : AnchorTestComponent;

    this.anchors.anchorTo(this.target()!, portal, { ...this.config, anchoring: position });
  }
}

@Component({
  standalone: true,
  template: `
    <div class="bg-white p-4 shadow shadow-black/50 rounded">
      <div>This is a custom component</div>
      <div>Data : {{ data }}</div>
      <button (click)="close()">❌</button>
    </div>
  `,
})
class AnchorTestComponent {
  close = inject(OVERLAY_CLOSER);
  data = inject(OVERLAY_DATA);
}
