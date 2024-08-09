import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  DestroyRef,
  inject,
  Injector,
  output,
  signal,
  TemplateRef,
  Type,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subject, take } from 'rxjs';
import { ActionEmitter, OverlayExtensionHelperArg, OverlayPortal } from './overlays.common';

const containerName = 'dialogs-container';
let component: ComponentRef<DialogsComponent>;

export type AppDialogConfig = {
  /** When true, the dialog gets closed when the user clicks on the backdrop */
  backdropClose: boolean;
  /** When true, the dialog gets closed when the user navigates with the router */
  navigationClose: boolean;
};

type AppDialog<T, C> = {
  portal: OverlayPortal<T, C>;
  injector: Injector;
  context: C;
  configuration: AppDialogConfig;
};

/** ---
 * Provide dialog functions to the overlays composable
 *
 * ```typescript
 * class MyClass { dialogs = provideOverlays(withDialogs()); }
 * ```
 */
export function withDialogs(baseConfiguration?: Partial<AppDialogConfig>) {
  return function ({ initContainer, createComponent, createContainer, createHandler }: OverlayExtensionHelperArg) {
    return {
      /** Opens a dialog for the user
       *
       * @param portal The portal to display (component class / template ref)
       * @param data Optional data to pass to the component
       * @param configuration Optional configuration
       */
      dialog(portal: OverlayPortal<any, any>, data?: any, configuration?: Partial<AppDialogConfig>) {
        const config: AppDialogConfig = {
          backdropClose: true,
          navigationClose: true,
          ...baseConfiguration,
          ...configuration,
        };

        const host = initContainer();
        const container = createContainer(containerName);
        host.appendChild(container);

        if (!component) {
          component = createComponent(DialogsComponent, container);
          component.instance.allDismissed.subscribe(() => {
            component.destroy();
            component = undefined!;
          });
        }

        let dialog: AppDialog<any, any>;
        const { close, closed, context, injector } = createHandler(data, () => component.instance.removeDialog(dialog));
        dialog = component.instance.addDialog(portal, config, context, injector);

        return { close, closed };
      },
      clear: () => component.instance.clearDialogs(),
    };
  };
}

/** @internal Component that shows the dialogs */
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, NgComponentOutlet],
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
        (click)="!isCurrent && setActiveDialog(dialog)">
        @if (isComponent(dialog.portal)) {
          <ng-container *ngComponentOutlet="dialog.portal; injector: dialog.injector"></ng-container>
        } @else if (isTemplate(dialog.portal)) {
          <ng-container *ngTemplateOutlet="dialog.portal; context: dialog.context"></ng-container>
        }
      </div>
    }`,
  styles: `
    :host {
      position: absolute;
      z-index: 1;
      top: 0;
      left: 0;
      height: 100%;
      width: 100%;
      display: flex;
      flex-flow: row;
      align-items: flex-end;
      justify-content: flex-start;
      gap: 1rem;
      pointer-events: all; /* IMPORTANT: Allows user to interact with the backdrop & dialogs */

      .__backdrop {
        position: absolute;
        z-index: 0;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(black, 0.5);
      }

      .__panel {
        position: absolute;
        left: 50%;
        top: 50%;
        translate: -50% -50%;
        z-index: 1;
        background-color: white;
        box-shadow: 1px 1px 3px 1px rgba(black, 0.5);
        padding: 1rem;
        border-radius: 0.25rem;

        &.__hidden {
          margin-top: -1rem;
          top: 100%;
          left: 1rem;
          translate: 0%;
          cursor: pointer;
        }
      }
    }
  `,
})
class DialogsComponent {
  private router = inject(Router, { optional: true });
  private destroyRef = inject(DestroyRef);
  private cd = inject(ChangeDetectorRef);
  protected dialogs = signal<AppDialog<any, any>[]>([]);
  protected currentDialog = signal<AppDialog<any, any>>(undefined!);

  public allDismissed = output<void>();

  addDialog<T, C>(portal: OverlayPortal<T, C>, configuration: AppDialogConfig, context: C, injector: Injector) {
    const dialog: AppDialog<T, C> & Partial<ActionEmitter> = <any>{}; // Workaround to inject the closeProvider after injector creation

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

  protected isTemplate<T, C>(portal: OverlayPortal<T, C>): portal is TemplateRef<any> {
    return portal instanceof TemplateRef;
  }

  protected isComponent<T, C>(portal: OverlayPortal<T, C>): portal is Type<T> {
    return !this.isTemplate(portal);
  }
}
