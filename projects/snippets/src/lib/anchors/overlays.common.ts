import { DOCUMENT } from '@angular/common';
import {
  createComponent as _createComponent,
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  inject,
  TemplateRef,
  Type,
} from '@angular/core';
import { filter, fromEvent, map, Observable, race, repeat, take, zip } from 'rxjs';

// Global variables that act as singletons
const mainContainerName = 'overlays-container';
const containers = new Map<string, HTMLElement>();
const sheets = new Map<string, HTMLStyleElement>();

/** @internal Basic styles to make the overlays work properly */
const styles = `.__${mainContainerName} {
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}`;

/** @internal Accepted types for creating overlays (component class / template ref) */
export type OverlayPortal<T, D> = Type<T> | TemplateRef<{ data: D }>;

/** @internal */
type OverlayExtensionArgs = {
  /**
   * Initializes the main container, used to hold overlays
   *
   * This container is self managed :
   *   - Styled to cover the whole page
   *   - Pointer events are disabled on it (making it fully "transparent" to the user)
   *   - It self-destructs when emptied
   */
  initContainer: () => HTMLElement;
  /**
   * Creates a container that destroys itself when emptied
   * @param id A unique ID to identify the controller
   * @param style An optional style declaration to bind to the container
   */
  createContainer: (id: string, style?: string) => HTMLElement;
  /**
   * Creates a component ref (angular internal) of a given component class
   * @param component The component to create
   * @param container The container to append the component to
   */
  createComponent: <T = any>(component: Type<T>, container: HTMLElement) => ComponentRef<T>;
  /** Observable that emits when the user clicks outside of the given container (single emission, cold observable) */
  clickOutside: (container: HTMLElement) => Observable<any>;
  /** Observable that emits when the user scrolls/swipes outside of the given container (single emission, cold observable) */
  scrollOutside: (container: HTMLElement) => Observable<any>;
};

/** @internal Type that extensions must implement to be used with `provideOverlays` */
export type OverlayExtension<T = any> = (args: OverlayExtensionArgs) => T;

export function provideOverlays<T extends any[]>(...extensions: T): Composable<T> {
  const injector = inject(EnvironmentInjector);
  const appRef = inject(ApplicationRef);
  const doc = inject(DOCUMENT);
  const body = doc.body;

  const helper: OverlayExtensionArgs = {
    initContainer: () => createManagedContainer(mainContainerName, doc, body, styles),
    createContainer: (id, style) => createManagedContainer(id, doc, body, style),
    createComponent: (component, container) => createComponent(component, injector, appRef, container),
    clickOutside: (container) => clickedOutside(doc, container),
    scrollOutside: (container) => scrolledOutside(doc, container),
  };

  const ret: any = {};
  for (const extension of extensions) Object.assign(ret, extension(helper));
  return ret;
}

/** @internal Creates a self managed container if required (the container removes itself when emptied) */
function createManagedContainer(id: string, doc: Document, body: HTMLElement, style?: string) {
  let container = containers.get(id)!;
  if (container) return container;
  container = doc.createElement('div');
  containers.set(id, container);
  container.classList.add(`__${id}`);
  body.appendChild(container);
  const sheet = style ? createStylesheet(id, doc, style) : null;
  new MutationObserver(function (records, observer) {
    if (container.hasChildNodes()) return;
    observer.disconnect();
    container.remove();
    containers.delete(id);
    if (sheet) {
      sheet.remove();
      sheets.delete(id);
    }
  }).observe(container, { childList: true });
  return container;
}

/** @internal Creates an instance of the provided component */
function createComponent<T>(
  component: Type<T>,
  environmentInjector: EnvironmentInjector,
  applicationRef: ApplicationRef,
  container: HTMLElement,
) {
  const hostElement = document.createElement('div');
  const ref = _createComponent(component, { environmentInjector, hostElement });
  applicationRef.attachView(ref.hostView);
  container.appendChild(hostElement);
  return ref;
}

/** @internal Creates a self managed style sheet (gets removed with its corresponding container) */
function createStylesheet(id: string, doc: Document, style: string) {
  let sheet = sheets.get(id);
  if (sheet) return sheet;
  sheet = doc.createElement('style');
  doc.head.appendChild(sheet);
  sheet.innerHTML = style;
  sheets.set(id, sheet);
  return sheet;
}

/** @internal Observable that emits when the user clicks outside the given container */
function clickedOutside(doc: Document, container: HTMLElement) {
  return fromEvent<MouseEvent>(doc, 'pointerdown').pipe(
    map((event) => event.target as HTMLElement),
    map((target) => !container.contains(target)),
    filter(Boolean),
    take(1),
  );
}

/** @internal Observable that emits when the user scrolls outside the given container (either wheel or swipe) */
function scrolledOutside(doc: Document, container: HTMLElement) {
  return race(
    fromEvent<WheelEvent>(doc, 'wheel').pipe(map((event) => event.target as HTMLElement)),
    zip(
      fromEvent<TouchEvent>(doc, 'touchstart').pipe(take(1)),
      fromEvent<TouchEvent>(doc, 'touchmove').pipe(take(1)),
    ).pipe(
      map(([start, end]) => start.target as HTMLElement),
      repeat(),
    ),
  ).pipe(
    map((target) => !container.contains(target)),
    filter(Boolean),
    take(1),
  );
}

/** @internal customized composable type */
type Composable<T extends any[]> =
  { [I in keyof T]: (x: T[I]) => void } extends Record<`${number}`, (x: infer U extends (...args: any) => any) => void>
    ? ReturnType<U>
    : never;
