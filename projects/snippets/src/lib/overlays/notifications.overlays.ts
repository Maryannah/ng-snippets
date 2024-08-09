import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DestroyRef,
  inject,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, take, takeUntil, timer } from 'rxjs';
import { ActionEmitter, OverlayExtensionHelperArg } from './overlays.common';

const containerName = 'notifications-container';
let component: ComponentRef<NotificationsComponent>;

export type AppNotification = {
  template?: TemplateRef<any>; // TemplateRef takes precedence over message
  message?: string;
  type?: 'error' | 'info' | 'success';
  /** If the user is allowed to close the notification himself */
  dismissable: boolean;
  /** Duration in milliseconds, set to `0` to make it infinite */
  duration: number;
};

/** Use this composable function to provide notifications to your overlays
 *
 * @example
 * ```typescript
 * class MyClass {
 *   notifications = provideOverlays(withNotifications());
 * }
 * ```
 */
export function withNotifications(baseConfiguration?: Partial<AppNotification>) {
  return function ({ initContainer, createComponent, createContainer }: OverlayExtensionHelperArg) {
    return {
      /** Creates a notification for the user
       *
       * @param configuration The optional configuration of the notification
       */
      notify(configuration?: Partial<AppNotification>) {
        const notification: AppNotification = {
          duration: 3000,
          dismissable: true,
          ...baseConfiguration,
          ...configuration,
        };

        if (!configuration?.template && !configuration?.message)
          throw new Error('Notifications : provide either a template or a message');

        const host = initContainer();
        const container = createContainer(containerName);
        host.appendChild(container);

        if (!component) {
          component = createComponent(NotificationsComponent, container);
          component.instance.allDismissed.subscribe(() => {
            component.destroy();
            component = undefined!;
          });
        }

        component.instance.addNotification(notification);

        return {};
      },
    };
  };
}

/** @internal Component that shows the notifications */
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  template: `@for (notification of notifications(); track notification) {
    <div
      class="__notification"
      [class.__dismissable]="notification.dismissable"
      [attr.data-type]="notification.type"
      (click)="notification.dismissable && removeNotification(notification)">
      @if (notification.template) {
        <ng-container
          *ngTemplateOutlet="notification.template; context: { $implicit: templateClose(notification) }"></ng-container>
      } @else if (notification.message) {
        <span>{{ notification.message }}</span>
      }
    </div>
  }`,
  styles: `
    :host {
      position: absolute;
      z-index: 5000;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      display: flex;
      flex-flow: column;
      align-items: flex-end;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1rem;

      .__notification {
        pointer-events: all; /* IMPORTANT: Allows user to interact with the notification */
        display: flex;
        flex-flow: row;
        align-items: center;
        justify-content: flex-start;
        gap: 1rem;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        background: white;
        box-shadow: 1px 1px 3px 1px rgba(black, 0.25);

        &.__dismissable {
          cursor: pointer;
        }

        &[data-type='success'] {
          background-color: rgba(lime, 0.5);
        }
        &[data-type='error'] {
          background-color: rgba(pink, 0.5);
        }
        &[data-type='info'] {
          background-color: rgba(cyan, 0.5);
        }
      }
    }
  `,
})
class NotificationsComponent {
  private destroyRef = inject(DestroyRef);
  private notificationsCollection = new Set<AppNotification>();
  protected notifications = signal<AppNotification[]>([]);
  public allDismissed = output<void>();

  /** @internal Function used when using a templateRef */
  protected templateClose = (n: AppNotification) => () => this.removeNotification(n);

  addNotification(notification: AppNotification & Partial<ActionEmitter>) {
    this.notificationsCollection.add(notification);
    this.notifications.set(Array.from(this.notificationsCollection));
    notification.__closeEmitter = new Subject<void>();
    if (notification.duration)
      timer(notification.duration)
        .pipe(takeUntilDestroyed(this.destroyRef), takeUntil(notification.__closeEmitter), take(1))
        .subscribe(() => this.removeNotification(notification));
    return notification.__closeEmitter.asObservable().pipe(take(1));
  }

  removeNotification(notification: AppNotification & Partial<ActionEmitter>) {
    notification.__closeEmitter?.next();
    this.notificationsCollection.delete(notification);
    this.notifications.set(Array.from(this.notificationsCollection));
    if (!this.notificationsCollection.size) this.allDismissed.emit();
  }

  clearNotifications() {
    this.notificationsCollection.clear();
    this.notifications.set([]);
    this.allDismissed.emit();
  }
}
