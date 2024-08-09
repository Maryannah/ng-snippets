import { ChangeDetectionStrategy, Component, inject, TemplateRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppDialogConfig, withDialogs } from '@snippets/overlays/dialogs.overlays';
import { OVERLAY_CLOSER, OVERLAY_DATA, provideOverlays } from '@snippets/overlays/overlays.common';
import { APP_ROUTES } from '../../app.routes';

@Component({
  selector: 'snip-dialogs',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dialogs.component.html',
  styleUrl: './dialogs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DialogsComponent {
  dialogs = provideOverlays(withDialogs());
  router = inject(Router);
  routes = inject(APP_ROUTES);

  config: AppDialogConfig = {
    backdropClose: true,
    navigationClose: true,
  };

  data = 'Some string';

  tpl = viewChild<TemplateRef<any>>('tpl');

  dialog(useTemplate = false) {
    this.dialogs.dialog(useTemplate ? this.tpl()! : DialogTestComponent, { data: this.data }, this.config);
  }
}

@Component({
  standalone: true,
  template: `
    <div class="grid grid-cols-2 items-center justify-stretch gap-4">
      <span class="col-span-2">This is a component dialog</span>

      <span class="justify-self-start">Data :</span>
      <span>{{ data.data }}</span>

      <button designed (click)="router.navigateByUrl(routes.notifications('/'))">Navigate away</button>
      <button designed (click)="close()">Close</button>
    </div>
  `,
})
export class DialogTestComponent {
  data = inject(OVERLAY_DATA);
  close = inject(OVERLAY_CLOSER);
  router = inject(Router);
  routes = inject(APP_ROUTES);
}
