import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, TemplateRef } from '@angular/core';
import {
  AppDialogConfig,
  AppNotification,
  DIALOG_CLOSE_FN,
  DIALOG_DATA,
  injectDialogs,
  injectNotifications,
} from '../../snippets/overlays/overlays.utils';

@Component({
  selector: 'snip-overlays',
  standalone: true,
  imports: [JsonPipe],
  templateUrl: './overlays.component.html',
  styleUrl: './overlays.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class OverlaysComponent {
  private notifications = injectNotifications({ duration: 3000, dismissable: true, message: 'Notification !' });
  private dialogs = injectDialogs({ backdropClose: true, navigationClose: true });

  notify(notification: Partial<AppNotification> = {}) {
    const { closed } = this.notifications.add({ ...notification });
    closed.subscribe(() => console.log('Notification dismissed'));
  }

  dialog(template?: TemplateRef<any>, config?: Partial<AppDialogConfig>) {
    const data = { mode: template ? 'template' : 'component' };
    const { closed } = this.dialogs.add(template ?? DialogDemoComponent, data, config);
    closed.subscribe(() => console.log('Dialog dismissed'));
  }
}

@Component({
  standalone: true,
  imports: [JsonPipe],
  template: `<pre><code>{{ data | json }}</code></pre>
    <button (click)="close()" class="mt-4 w-full">close</button>`,
})
export class DialogDemoComponent {
  protected data = inject(DIALOG_DATA);
  protected close = inject(DIALOG_CLOSE_FN);
}
