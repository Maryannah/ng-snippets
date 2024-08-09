# Overlays

_<sup>(Overlay : piece of HTML that floats above the rest of the application)</sup>_

Overlays are defined by a composable function, that does nothing by itself, but when composed, it provides multiple features.

```typescript
class MyClass {
  dialogs = provideOverlays(withDialogs());
  anchors = provideOverlays(withAnchors());
  notifications = provideOverlays(withNotifications());

  overlays = provideOverlays(withDialogs(), withAnchors(), withNotifications());
}
```

<!-- TODO JSDOC + LOGIC -->
<!--
  ! - Détails des fonctions de chaque extension
  ! - Base config, call config, default config + merge des 3
  ! - Nouvelle fonction common qui retourne un un closeEmitter + closingFn
-->
