# Datepicker

```bash
# Snippet grabbing
node snipgrab forms/datepicker/datepicker.component.ts
```

Simple & efficient date picker with better control than an input of `type="date"`.

Accepts a `FormControl`/`NgModel` directive, but can work without it (emits a `(dateChange)` event).

In the header, you can :

- Click on the year to see a panel of years to quickly choose from
- Click on the month to quickly change the displayed month
- Use incremental buttons to slide the current view

```typescript
@Component({
  standalone: true,
  imports: [DatepickerComponent, ReactiveFormsModule],
})
class MyComponent {
  control = new FormControl(new Date());
}
```

```html
<ui-datepicker [formControl]="control"></ui-datepicker>
<div>Date : {{ control.value }}</div>
```
