import { InjectionToken } from '@angular/core';
import { Route } from '@angular/router';

/** Declare your routes here, you can declare static props or customized functions like the provided examples */
const appRoutes = {
  root: (relpath = '') => `${relpath}`,
  userProfile: (userId: string, relpath = '') => `${relpath}users/${userId}/profile`,
};

export const APP_ROUTES = new InjectionToken('NgSnippetsApplicationRoutes', { factory: () => appRoutes });

/** Application routes that you can use inside `provideRouter` */
export const routes: Route[] = [];
