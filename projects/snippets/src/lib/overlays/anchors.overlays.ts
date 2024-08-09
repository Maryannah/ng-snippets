import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ElementRef, model, TemplateRef } from '@angular/core';
import { race, take } from 'rxjs';
import { OverlayExtensionHelperArg, OverlayPortal } from './overlays.common';

const containerName = 'anchors-container';
const styles = `.__${containerName} {
  position: absolute;
  z-index: 0;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}`;

/** Use this composable function to provide anchors to your overlays.
 *
 * Anchors are HTML elements that are positioned according to their target element.
 *
 * They are out of the flow of the page, and get closed if you click/scroll/swipe outside of them.
 *
 * They are useful for making things like popovers, dropdowns, etc.
 *
 * @example
 * ```typescript
 * class MyClass {
 *   anchors = provideOverlays(withAnchors());
 * }
 * ```
 */
export function withAnchors<D>(baseConfiguration?: Partial<AnchorConfiguration<D>>) {
  return function ({
    initContainer,
    createComponent,
    clickOutside,
    scrollOutside,
    createContainer,
  }: OverlayExtensionHelperArg) {
    return {
      /** Anchors the given portal to the given element, with the given configuration.
       *
       * @param anchorElement The target element the anchor should be anchored to
       * @param portal The portal to display (component class / template ref)
       * @param configuration The optional configuration of the anchor
       */
      anchorTo<T = any, DD = any>(
        anchorElement: ElementRef<HTMLElement> | HTMLElement,
        portal: OverlayPortal<T, D>,
        configuration?: Partial<AnchorConfiguration<D>>,
      ) {
        const host = initContainer();
        const config: AnchorConfiguration<any> = {
          anchoring: 'auto',
          capturePointer: false,
          ...baseConfiguration,
          ...configuration,
        };
        const element = anchorElement instanceof ElementRef ? anchorElement.nativeElement : anchorElement;
        const container = createContainer(containerName, styles);
        host.appendChild(container);
        if (config?.capturePointer) container.style.pointerEvents = 'all';
        else container.style.pointerEvents = 'none';
        const ref = createComponent(AnchorDisplayComponent, container);
        ref.instance.$portal.set(portal);
        ref.instance.$data.set(config?.data ?? null);
        ref.instance.$targetrect.set(element.getBoundingClientRect());
        ref.instance.$anchoring.set(config.anchoring);

        setTimeout(() =>
          race(clickOutside(ref.location.nativeElement), scrollOutside(ref.location.nativeElement))
            .pipe(take(1))
            .subscribe(() => ref.destroy()),
        );
      },
    };
  };
}
/** @internal Component in charge of displaying user-defined portals */
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, NgComponentOutlet],
  template: `
    @let portal = $portal();
    @if (isTemplate(portal)) {
      <ng-container *ngTemplateOutlet="portal; context: $context()"></ng-container>
    } @else {
      <ng-container *ngComponentOutlet="portal"></ng-container>
    }
  `,
  styles: `
    :host {
      position: absolute;
      display: block;
      pointer-events: all;
    }
  `,
  host: {
    '[style.top.px]': '$offsets().top',
    '[style.left.px]': '$offsets().left',
    '[style.translate]': '$offsets().translate',
  },
})
class AnchorDisplayComponent<T, D> {
  $portal = model.required<OverlayPortal<T, D>>();
  $targetrect = model.required<DOMRect>();
  $data = model<D>(null!);
  $anchoring = model<AnchorConfiguration<any>['anchoring']>('auto');

  protected $context = computed(() => ({ data: this.$data() }));

  /** @internal determine the position of the anchor given various parameters */
  private $offsets = computed<Record<'top' | 'left' | 'translate', number | string>>(() => {
    const rect = this.$targetrect();
    let [auto, anchorY, anchorX, , targetY, targetX]: [
      'auto' | 'anchor',
      AnchoringPositionsY,
      AnchoringPositionsX,
      string,
      AnchoringPositionsY,
      AnchoringPositionsX,
    ] = this.$anchoring()!.split(' ') as any;

    const offsets = { top: rect.y, left: rect.x, translate: '' };

    if (auto === 'auto') {
      const middleX = window.innerWidth / 2;
      const middleY = window.innerHeight / 2;
      const posX = rect.x + rect.width / 2;
      const posY = rect.y + rect.height / 2;

      // Top side
      if (posY < middleY) {
        anchorY = 'top';
        targetY = 'bottom';
      }
      // Bottom side
      else {
        anchorY = 'bottom';
        targetY = 'top';
      }
      // Left side
      if (posX < middleX) {
        anchorX = 'left';
        targetX = 'left';
      }
      // Right side
      else {
        anchorX = 'right';
        targetX = 'right';
      }
    }

    let translateX = 0;
    let translateY = 0;
    if (targetX === 'center') offsets.left += rect.width / 2;
    if (targetX === 'right') offsets.left += rect.width;

    if (targetY === 'middle') offsets.top += rect.height / 2;
    if (targetY === 'bottom') offsets.top += rect.height;

    if (anchorX === 'center') translateX = -50;
    if (anchorX === 'right') translateX = -100;

    if (anchorY === 'middle') translateY = -50;
    if (anchorY === 'bottom') translateY = -100;

    offsets.translate = `${translateX}% ${translateY}%`;

    return offsets;
  });

  isTemplate = (portal: OverlayPortal<T, D>): portal is TemplateRef<any> => portal instanceof TemplateRef;
}

// Internal interfaces
type AnchoringPositionsX = 'left' | 'center' | 'right';
type AnchoringPositionsY = 'top' | 'middle' | 'bottom';
type AnchoringKeys = `${AnchoringPositionsY} ${AnchoringPositionsX}`;

/** Anchor configuration that can be provided to `injectAnchors` or at every utuility function call */
export type AnchorConfiguration<D> = Partial<{
  data: D;
  /**
   * Whether to capture mouse events (user is unable to interact with the rest of the page)
   *
   * Examples when activating :
   *   - Prevents the user from scrolling containers.
   *   - Prevents the user from making clicks/touches/gestures
   */
  capturePointer: boolean;
  /** Anchoring positioning in a verbose style.
   *
   * The syntax is `anchor [anchor position] to [target position]`, where positions are `Y X`
   * > The **`[ Y-X corner ]`** corner of the anchor should be connected to the **`[ Y-X corner ]`** corner of the target
   *
   * Examples :
   *   - `auto` : let the feature place the anchor where it will remain on screen
   *   - `anchor top left to bottom left` : The top left corner of the anchor should be connected to the bottom left corner of the target
   *   - `anchor bottom right to top right` : The bottom right corner of the anchor should be connected to the top right corner of the target
   */
  anchoring: `anchor ${AnchoringKeys} to ${AnchoringKeys}` | 'auto';
}>;
