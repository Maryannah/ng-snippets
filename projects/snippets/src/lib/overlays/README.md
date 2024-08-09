# Overlays

```bash
# Snippet grabbing
node snipgrab overlays/overlays.common.ts \
  overlays/anchors.overlays.ts \
  overlays/dialogs.overlays.ts \
  overlays/notifications.overlays.ts
```

_<sup>(Overlay : piece of HTML that floats above the rest of the application)</sup>_

Overlays are defined by a composable function, that does nothing by itself, but when composed, it provides multiple features.

**IMPORTANT** You need to have `overlays.common.ts` to use the other `*.overlays.ts` files !  
Also, this file is useless by itself, it's made to provide commonized behavior between overlays.

```typescript
class MyClass {
  dialogs = provideOverlays(withDialogs());
  anchors = provideOverlays(withAnchors());
  notifications = provideOverlays(withNotifications());

  overlays = provideOverlays(withDialogs(), withAnchors(), withNotifications());
}
```

## Things to know

- There are 3 configuration types that all get spread in a final one :
  - Default configuration, in the snippet (weakest)
  - Composition configuration, declared optionally in `withXXX()` functions
  - Fine configuration, provided in each function call (strongest)
- You can inject as many `provideOverlays()` as you want, as well as `withXXX()`
- You can combine all `withXXX()` into a single `provideOverlays()`, or separate them
- You can create your own `withXXX` function pretty simply to extend the composables
- A container gets added/removed to the body as needed, to contain the overlays
  - Each composition has its own container on top of the previous container, for better control
- The Z-order is :
  - Notifications (highest)
  - Dialogs
  - Anchors (lowest)
- All composed functions return (at least) :
  - `close: <T>(data: T) => void` to close the overlay
  - `closed: Observable<T>` to get notified when the overlay is closed
- All overlays share the same tokens / contexts (when applicable) :

```typescript
class MyOverlay {
  close = inject(OVERLAY_CLOSER);
  data = inject<any>(OVERLAY_DATA);
}
```

```html
<ng-template #myTemplate let-data="data" let-close="close">
  <span> {{ data | json }} </span>
  <button (click)="close">Close</button>
</ng-template>
```

### Anchors misc.

- They get automatically closed when
  - You click outside of it
  - You swipe/scroll outside of it
- If you click/swipe/scroll in it, it does not get closed
- You can capture pointer events to avoid user errors
  - e.g. anchor opened, but user wants to click on a button outside of it
    - If capturing, will have to click twice (close, then click)
    - If not capturing, will have to click once (close & click)
- They have automatic positioning but you can place them by hand
  - The syntax is very verbose so that you don't have to think too much, you baboon
  - _(read the JSDoc of the configuration's `anchoring` prop)_

### Notifications misc.

- If dimissing is allowed, click on it to remove them
- They accept an optional type to customize them with CSS
- You can use `clear` to remove all of them at once
- Make them infinite by setting their duration to 0
- Provide either a message or a template, otherwise it will pop an error
- Unlike other composed functions, they do not accept components
  - Their purpose is a quick notification to the user
  - In rare cases of customization, use a template ref
  - If you don't like them, just edit their code !

### Dialogs misc.

- You can use `clear` to remove all of them at once
- You can manage multiple dialogs at once
  - Queued ones get docked at the bottom left of the screen
  - Click on them to bring them back to the foreground
