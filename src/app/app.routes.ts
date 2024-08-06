import { InjectionToken } from '@angular/core';
import { Route } from '@angular/router';

const appRoutes = {
  overlays: (relpath = '') => `${relpath}overlays`,
  datepicker: (relpath = '') => `${relpath}datepicker`,
};

export const APP_ROUTES = new InjectionToken('NgSnippetsApplicationRoutes', { factory: () => appRoutes });

export const routes: Route[] = [
  { path: appRoutes.overlays(), loadComponent: () => import('./pages/overlays/overlays.component') },
  { path: appRoutes.datepicker(), loadComponent: () => import('./pages/datepicker/datepicker.component') },
];
