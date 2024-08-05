# Overlays

_(Overlay : content that is displayed above other content)_

Use those functions to display application overlays to the user, such as notifications, dialogs, etc.

The mechanism uses a global container that gets added & removed from the `<body>` when needed.

**IMPORTANT !** Be careful about the `pointer-events` in the style file : they control the behavior of the overlays, if you don't put them at the right place, they will prevent the user from have a smooth UX.  
<sub>_(Those props have been commented to help you place them correctly)_</sub>

```typescript
class MyComponent {
  private notifications = injectNotifications();
  private dialogs = injectDialogs();
}
```

```html
<!-- When using custom templates, you can close the notification like so -->
<ng-template #customNotificationTemplate let-close>
  <span>Custom notification template</span>
  <button (click)="close()">close</button>
</ng-template>
<!-- When using custom templates, you can acces dialog context like so -->
<ng-template #customDialogTemplate let-data="data" let-close="close">
  <span>Custom dialog template</span>
  <pre><code>{{ data | json }}</code></pre>
  <button (click)="close()">close</button>
</ng-template>
```

## Default behaviors implemented

### Notifications

- Stays on screen for 3 seconds
- Is dismissable by the user
- Gets dismissed when clicking on it

### Dialogs

- The last one opened is displayed, the previous ones are hidden with CSS
- They get dismissed when clicking on the backdrop
- They get dismissed if the router is used
