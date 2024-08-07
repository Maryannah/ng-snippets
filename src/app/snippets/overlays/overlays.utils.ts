import { DOCUMENT, NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  createComponent as _createComponent,
  ApplicationRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  DestroyRef,
  EnvironmentInjector,
  inject,
  InjectionToken,
  Injector,
  output,
  Provider,
  signal,
  TemplateRef,
  Type,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, single, Subject, take, takeUntil, timer } from 'rxjs';

/** @internal global overlays container */
let overlaysContainer: HTMLElement;
/** @internal notifications displayer */
let notificationsComponent: ComponentRef<NotificationsComponent>;
/** @internal dialogs displayer */
let dialogsComponent: ComponentRef<DialogsComponent>;

/** Use this token to inject your dialog data into your component */
export const DIALOG_DATA = new InjectionToken<any>('NgSnippetsDialogData');
/** Use this token to get a function used to close the dialog from within itself */
export const DIALOG_CLOSE_FN = new InjectionToken<() => void>('NgSnippetsDialogCloseFunction');

export type AppNotification = {
  template?: TemplateRef<any>; // TemplateRef takes precedence over message
  message?: string;
  type?: 'error' | 'info' | 'success';
  /** If the user is allowed to close the notification himself */
  dismissable: boolean;
  /** Duration in milliseconds, set to `0` to make it infinite */
  duration: number;
};

/** @internal */
type AppDialogPortal<T, C> = Type<T> | TemplateRef<C>;

export type AppDialogConfig = {
  /** When true, the dialog gets closed when the user clicks on the backdrop */
  backdropClose: boolean;
  /** When true, the dialog gets closed when the user navigates with the router */
  navigationClose: boolean;
};

export type AppDialog<T, C> = {
  portal: AppDialogPortal<T, C>;
  injector: Injector;
  context: C;
  configuration: AppDialogConfig;
};

/**
 * Use this function to inject the notifications manager and display notifications to the user
 *
 * @param {AppNotification} base Optional default configuration for each notification
 * @see {@link AppNotification} The configuration for a notification
 * @example ```typescript
 * class MyComponent {
 *   private notifications = injectNotifications();
 *   private notifications = injectNotifications({ duration: 300 });
 * }
 * ```
 */
export function injectNotifications(base: AppNotification = { dismissable: true, duration: 3000 }) {
  const appRef = inject(ApplicationRef);
  const injector = inject(EnvironmentInjector);
  const document = inject(DOCUMENT);
  const body = document.body;

  return {
    /**
     * Displays a notification to the user
     * @returns The notification created, a handle to close it, and an event triggered when it gets closed
     */
    add(notification: Partial<AppNotification>) {
      const _notification = { ...base, ...notification };
      return {
        notification: _notification,
        closed: notify(body, appRef, injector, _notification),
        close() {
          return notificationsComponent.instance.removeNotification(_notification);
        },
      };
    },
    /** Removes a given notification */
    remove(notification: AppNotification) {
      return notificationsComponent?.instance.removeNotification(notification);
    },
    /** Removes all notifications */
    clear() {
      return notificationsComponent?.instance.clearNotifications();
    },
  };
}

/**
 * Use this function to inject the dialogs manager and display dialogs to the user
 *
 * @param {AppDialogConfig} base Optional default configuration for each dialog
 * @see {@link AppDialogConfig} The configuration for a dialog
 * @example ```typescript
 * class MyComponent {
 *   private dialogs = injectDialogs();
 *   private dialogs = injectDialogs({ backdropClose: false });
 * }
 * ```
 */
export function injectDialogs(base: AppDialogConfig = { backdropClose: true, navigationClose: true }) {
  const appRef = inject(ApplicationRef);
  const injector = inject(EnvironmentInjector);
  const document = inject(DOCUMENT);
  const body = document.body;

  return {
    /**
     * Displays a dialog to the user
     * @returns The dialog created, a handle to close it, and an event triggered when it gets closed
     */
    add<T, C>(portal: AppDialogPortal<T, C>, data: any = null!, configuration?: Partial<AppDialogConfig>) {
      const _dialog = dialog(body, appRef, injector, portal, data, { ...base, ...configuration });
      return {
        dialog: _dialog,
        closed: _dialog.__closeEmitter!.asObservable().pipe(take(1)),
        close() {
          return dialogsComponent.instance.removeDialog(_dialog);
        },
      };
    },
    /** Removes a given dialog */
    remove<T, C>(dialog: AppDialog<T, C>) {
      return dialogsComponent?.instance.removeDialog(dialog);
    },
    /** Removes all dialogs */
    clear() {
      return dialogsComponent?.instance.clearDialogs();
    },
  };
}

/** @internal Actual notification function */
function notify(
  body: HTMLElement,
  appRef: ApplicationRef,
  injector: EnvironmentInjector,
  notification: AppNotification,
) {
  ensureContainerExists(body);
  notificationsComponent = notificationsComponent ?? createComponent(NotificationsComponent, appRef, injector);

  notificationsComponent.instance.allDismissed.subscribe(() => {
    notificationsComponent?.destroy();
    notificationsComponent = undefined!;
    overlaysContainer = setContainerState(overlaysContainer)!;
  });

  return notificationsComponent.instance.addNotification(notification);
}

/** @internal Actual dialog function */
function dialog<T, C>(
  body: HTMLElement,
  appRef: ApplicationRef,
  injector: EnvironmentInjector,
  portal: AppDialogPortal<T, C>,
  data: any,
  configuration: AppDialogConfig,
) {
  ensureContainerExists(body);
  dialogsComponent = dialogsComponent ?? createComponent(DialogsComponent, appRef, injector);
  dialogsComponent.instance.allDismissed.subscribe(() => {
    dialogsComponent?.destroy();
    dialogsComponent = undefined!;
    overlaysContainer = setContainerState(overlaysContainer)!;
  });
  return dialogsComponent.instance.addDialog(portal, data, configuration);
}

/** @internal Creates the overlays main container when needed */
function ensureContainerExists(container: HTMLElement) {
  if (overlaysContainer) return;
  const div = document.createElement('div');
  div.classList.add('__overlay-body-container');
  container.appendChild(div);
  overlaysContainer = div;
}

/** @internal Removes the overlays main container when needed */
function setContainerState(container: HTMLElement) {
  if (!container) return undefined;
  if (container.hasChildNodes()) return container;
  container.remove();
  return undefined;
}

/** @internal Creates the given component and attaches it to the overlays container */
function createComponent<T = any>(
  component: Type<T>,
  appRef: ApplicationRef,
  environmentInjector: EnvironmentInjector,
) {
  const element = document.createElement('div');
  overlaysContainer.appendChild(element);
  const ref = _createComponent(component, { hostElement: element, environmentInjector });
  appRef.attachView(ref.hostView);
  return ref;
}

/** @internal */
type ActionEmitter = { __closeEmitter: Subject<void> };

/** @internal Component that shows the notifications */
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: { '[class.__notifications-container]': 'true' },
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
        .subscribe(() => notificationsComponent?.instance.removeNotification(notification));
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

/** @internal Component that shows the dialogs */
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, NgComponentOutlet],
  host: { '[class.__dialogs-container]': 'true' },
  template: `<div class="__backdrop" (click)="backdropClick()"></div>
    @let current = currentDialog();
    @let currentIndex = dialogs().indexOf(current);
    @for (dialog of dialogs(); track dialog) {
      @let isCurrent = dialog === current;
      @let afterCurrent = $index > currentIndex;
      @let factor = afterCurrent ? $index - 1 : $index;
      @let translate = !isCurrent ? factor * 100 : '';
      @let margin = !isCurrent ? factor * 1 : '';

      <div
        class="__panel"
        [class.__hidden]="!isCurrent"
        [style.translate.%]="translate"
        [style.margin-left.rem]="margin"
        (click)="setActiveDialog(dialog)">
        @if (isComponent(dialog.portal)) {
          <ng-container *ngComponentOutlet="dialog.portal; injector: dialog.injector"></ng-container>
        } @else if (isTemplate(dialog.portal)) {
          <ng-container *ngTemplateOutlet="dialog.portal; context: dialog.context"></ng-container>
        }
      </div>
    }`,
})
class DialogsComponent {
  private router = inject(Router, { optional: true });
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  protected dialogs = signal<AppDialog<any, any>[]>([]);
  protected currentDialog = signal<AppDialog<any, any>>(undefined!);

  public allDismissed = output<void>();

  addDialog<T, C>(portal: AppDialogPortal<T, C>, data: any, configuration: AppDialogConfig) {
    const dialog: AppDialog<T, C> & Partial<ActionEmitter> = <any>{}; // Workaround to inject the closeProvider after injector creation
    const dataProvider: Provider = { provide: DIALOG_DATA, useValue: data };
    const closeProvider: Provider = { provide: DIALOG_CLOSE_FN, useValue: () => this.removeDialog(dialog) };
    const providers: Provider[] = [dataProvider, closeProvider];
    const injector = Injector.create({ providers });
    const context: C = <C>{ data, close: closeProvider.useValue };
    Object.assign(dialog, {
      portal,
      injector,
      context,
      configuration,
      __closeEmitter: new Subject(),
    } as typeof dialog);
    if (configuration.navigationClose && this.router)
      this.router.events
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          filter((event) => event instanceof NavigationEnd),
          take(1),
        )
        .subscribe(() => this.removeDialog(dialog));
    this.dialogs.update((d) => [...d, dialog]);
    this.currentDialog.set(dialog);
    return dialog;
  }

  removeDialog<T, C>(dialog: AppDialog<T, C> & Partial<ActionEmitter>) {
    dialog.__closeEmitter?.next();
    this.dialogs.update((d) => d.filter((d) => d !== dialog));
    if (!this.dialogs().length) this.allDismissed.emit();
    else this.currentDialog.set(this.dialogs().at(-1)!);
    this.cd.detectChanges(); // Bugfix if you call the closeProvider.useValue function (TODO FIX)
  }

  clearDialogs() {
    this.dialogs.set([]);
    this.currentDialog.set(undefined!);
    this.allDismissed.emit();
  }

  setActiveDialog(dialog: AppDialog<any, any> & Partial<ActionEmitter>) {
    this.currentDialog.set(dialog);
  }

  protected backdropClick() {
    const dialog = this.currentDialog();
    if (!dialog?.configuration.backdropClose) return;
    this.removeDialog(dialog);
  }

  protected isTemplate<T, C>(portal: AppDialogPortal<T, C>): portal is TemplateRef<C> {
    return portal instanceof TemplateRef;
  }

  protected isComponent<T, C>(portal: AppDialogPortal<T, C>): portal is Type<T> {
    return !this.isTemplate(portal);
  }
}
