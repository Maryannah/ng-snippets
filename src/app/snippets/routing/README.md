# Routing helpers

## Application routes

Centralizes all of your application links for easy use.  
Inject the token to get a type-safe object containing all of your routes.

You can copy/paste the [content of this file](./app.routes.ts) into your `app.routes.ts` file.

```typescript
class MyComponent {
  protected appRoutes = inject(APP_ROUTES);
  private router = inject(Router);

  exampleFn() {
    this.router.navigateByUrl(this.appRoutes.home());
  }
}
```
