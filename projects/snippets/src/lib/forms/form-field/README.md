# Form field

```bash
# Snippet grabbing
node snipgrab forms/form-field/form-field.scam.ts
```

Improved form field that creates a smooth UI/UX for the user, instead of a basic input :

- label for the input
- prefix & suffix
- input hint
- input errors
- automatic input type switcher

Requires a `FormControl`/`NgModel` to work properly

```typescript
@Component({
  standalone: true,
  imports: [FormFieldModule, ReactiveFormsModule],
})
class MyComponent {
  control = new FormControl('', [Validators.required]);
}
```

```html
<ui-form-field>
  <label ui-label>Username</label>

  <span ui-zone="prefix">
    <button (click)="control.reset()">X</button>
  </span>

  <input ui-input type="text" placeholder="Username ..." [formControl]="control" />

  <span ui-zone="suffix">
    <ui-type-switch></ui-type-switch>
  </span>

  <span ui-zone="hint">Input hint</span>

  <ng-template ui-error="minlength" let-err> {{ err.actualLength }} / {{ err.requiredLength }} </ng-template>
</ui-form-field>
```

## Available features

- Auto-binding of the input & label (No `id`/`for` combo required)
- Automatic `*` on the label if required
- [Automatic error handling & displaying](#error-handling)
  - Provide default error templates
  - Provide your own, custom error templates when needed
- Input hint (displayed when no error is displayed)
- Automatic type switcher (`<ui-type-switch></ui-type-switch>`)
- Prefixes & Suffixes that go before/after the input
- [Field-scoped input state](#form-field-state)
- [Extensible zones system](#field-zones)

## Form field state

The form field has a state that depends on the corresponding input.  
It's super useful for styling.

The state is reflected with `data-X` attributes :

- `pristine`, `dirty`
- `touched`, `untouched`
- `valid`, `invalid`, `pending`
- `disabled`
- `empty`
- `required`

## Error handling

When writing a default template :

```typescript
const errors = {
  required: 'Required set to {{#}}', // "Required set to true"
  minlength: '{{requiredLength}} / {{actualLength}})', // "0 / 100"
};
```

- `{{#}}` writes the whole error value
- `{{propname}}` writes the prop in the error value

<sup>_(Be mindful of using no spaces in the `{{}}`)_</sup>

When writing a custom template :

```html
<!-- Preffered (no useless CSS) -->
<ng-template ui-error="minlength" let-err> {{ err.actualLength }} / {{ err.requiredLength }} </ng-template>
<!-- Avoid (the span serves no purpose) -->
<span *ui-error="'minlength'; let err"> {{ err.actualLength }} / {{ err.requiredLength }} </span>
```

- `ui-error` will set the error name to listen to
- `let-varname` will declare `varname` as the value of the error

**A custom template will always take precedence over a default one**

**If no error is found for a given name, nothing will get displayed, altough there will still be an error on the field**

## Field zones

The `[ui-zone]` directive is used to place specific zones on the form field : you can extend this behavior to add more zones, or remove zones you don't need.

The main use for zones is HTML structure & display : use a defined zone to place what you want, where you want it. 

Prefixes, suffixes & hints all use zones to be placed & styled.