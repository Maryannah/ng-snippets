import { ChangeDetectionStrategy, Component, TemplateRef, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppNotification, withNotifications } from '@snippets/overlays/notifications.overlays';
import { provideOverlays } from '@snippets/overlays/overlays.common';

@Component({
  selector: 'snip-notifications',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NotificationsComponent {
  overlays = provideOverlays(withNotifications());

  config: AppNotification = {
    message: 'Notification',
    duration: 3000,
    dismissable: true,
    type: undefined,
  };

  template = viewChild<TemplateRef<any>>('tpl');

  notify(useTemplate = false) {
    this.overlays.notify({
      ...this.config,
      ...(useTemplate ? { template: this.template(), message: undefined } : {}),
    });
  }
}
