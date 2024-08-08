import { InjectionToken } from '@angular/core';
import { Route } from '@angular/router';

const appRoutes = {
  overlays: (relpath = '') => `${relpath}overlays`,
  datepicker: (relpath = '') => `${relpath}datepicker`,
  formfield: (relpath = '') => `${relpath}form-field`,
  anchors: (relpath = '') => `${relpath}anchors`,
};

export const APP_ROUTES = new InjectionToken('NgSnippetsApplicationRoutes', { factory: () => appRoutes });

export const routes: Route[] = [
  {
    data: { label: 'Anchors' },
    path: appRoutes.anchors(),
    loadComponent: () => import('./pages/anchors/anchors.component'),
  },
  {
    data: { label: 'Overlays' },
    path: appRoutes.overlays(),
    loadComponent: () => import('./pages/overlays/overlays.component'),
  },
  {
    data: { label: 'Datepicker' },
    path: appRoutes.datepicker(),
    loadComponent: () => import('./pages/datepicker/datepicker.component'),
  },
  {
    data: { label: 'Form field' },
    path: appRoutes.formfield(),
    loadComponent: () => import('./pages/form-field/form-field.component'),
  },
];
