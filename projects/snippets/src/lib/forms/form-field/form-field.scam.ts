import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  contentChild,
  contentChildren,
  Directive,
  inject,
  InjectionToken,
  input,
  model,
  NgModule,
  TemplateRef,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NgControl, Validators } from '@angular/forms';
import { EMPTY, merge, switchMap } from 'rxjs';

/** @internal Allowed field zones, to style & prevent typos */
type FormFieldZones = 'prefix' | 'suffix' | 'hint';

/**
 * Form field errors default templates that you can override into your app config.
 * Those default templates are used when the field has the corresponding error and not custom template is provided.
 *
 * Use `{{errorPropName}}` syntax so that the feature replaces this placeholder with the actual prop value in the error.
 *
 * Use `{{#}}` syntax to replace the placeholder with the full value of the error.
 */
export const FIELD_ERRORS = new InjectionToken<Record<string, string>>('NgSnippetsFormFieldErrors', {
  factory: () => ({
    required: 'Required set to {{#}}',
    minlength: 'Min {{requiredLength}} characters (you have {{actualLength}}).',
  }),
});

/** Main component used to control a form field */
@Component({
  selector: 'ui-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ? Order is not random, it is placed like this for CSS optimization & compatibility, be mindful of that -->

    @if (showErrors) {
      <div class="__errors">
        @for (error of errors; track error) {
          @if (isTemplateError(error)) {
            <span class="__error">
              <ng-template *ngTemplateOutlet="error.template; context: error.context"></ng-template>
            </span>
          } @else {
            <span class="__error">{{ error }}</span>
          }
        }
      </div>
    }

    <div class="__label">
      <ng-content select="[ui-label]"></ng-content>
    </div>
    <div class="__prefix">
      <ng-content select="[ui-zone='prefix']"></ng-content>
    </div>
    <div class="__suffix">
      <ng-content select="[ui-zone='suffix']"></ng-content>
    </div>
    <div class="__hint">
      <ng-content select="[ui-zone='hint']"></ng-content>
    </div>
    <div class="__input">
      <ng-content select="[ui-input]"></ng-content>
    </div>
  `,
  styles: `
    :host {
      display: inline-grid;
      grid-template-areas: 'label label label' 'prefix input suffix' 'errors errors errors';
      grid-template-columns: minmax(0, max-content) 1fr minmax(0, max-content);

      border-color: black;

      .__prefix,
      .__suffix,
      .__input,
      .__label,
      .__hint,
      .__errors {
        place-self: stretch center;
        border: 1px solid;
        border-color: inherit;
        padding: 0.25rem;
      }

      .__errors {
        grid-area: errors;
        display: flex;
        flex-flow: column;
        align-items: stretch;
        justify-content: flex-start;
        gap: 0.5rem;
        color: red;
        font-size: smaller;
        place-self: stretch;
        margin-top: -1px;

        &:not(:empty) {
          ~ .__hint {
            display: none;
          }
        }
      }

      .__prefix,
      .__suffix {
        display: flex;
        flex-flow: row;
        align-items: center;
        justify-content: center;
        &:empty {
          display: none;
        }
      }

      .__hint {
        grid-area: errors;
        place-self: center stretch;
        text-align: end;
        font-size: smaller;
        margin-top: -1px;
      }

      .__prefix {
        grid-area: prefix;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
        margin-right: -1px;

        &:not(:empty) ~ .__input {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }
      }

      .__suffix {
        grid-area: suffix;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
        margin-left: -1px;

        &:not(:empty) ~ .__input {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }
      }

      .__label {
        grid-area: label;
        font-size: smaller;
        font-weight: bold;
        place-self: stretch;
        margin-bottom: -1px;
      }

      .__input {
        grid-area: input;
      }

      &[data-disabled] {
        opacity: 0.5;
      }
      &[data-required] {
        .__label::after {
          display: inline;
          content: ' *';
        }
      }
      &[data-invalid] {
        &:is(:not([data-untouched]), :not([data-pristine])) {
          border-color: red;
        }
      }
    }
  `,
  /** Attach the state of the input to the form field itself */
  host: {
    '[attr.data-required]': 'required',
    '[attr.data-disabled]': 'disabled',
    '[attr.data-empty]': 'empty',
    '[attr.data-touched]': 'touched',
    '[attr.data-untouched]': 'untouched',
    '[attr.data-pristine]': 'pristine',
    '[attr.data-dirty]': 'dirty',
    '[attr.data-pending]': 'pending',
    '[attr.data-invalid]': 'invalid',
    '[attr.data-valid]': 'valid',
  },
})
export class FormFieldComponent {
  public cd = inject(ChangeDetectorRef);
  public input = contentChild(FormFieldInputDirective);
  private errorTemplates = contentChildren(FormFieldErrorDirective);
  private control = computed(() => this.input()?.ngControl);
  private formErrors = inject(FIELD_ERRORS);

  /* prettier-ignore */ private get touched() { return asAttr(this.control()?.touched); }
  /* prettier-ignore */ private get untouched() { return asAttr(this.control()?.untouched); }
  /* prettier-ignore */ private get pristine() { return asAttr(this.control()?.pristine); }
  /* prettier-ignore */ private get dirty() { return asAttr(this.control()?.dirty); }
  /* prettier-ignore */ private get pending() { return asAttr(this.control()?.pending); }
  /* prettier-ignore */ private get invalid() { return asAttr(this.control()?.invalid); }
  /* prettier-ignore */ private get valid() { return asAttr(this.control()?.valid); }
  /* prettier-ignore */ private get required() { return asAttr(this.control()?.control?.hasValidator(Validators.required)); }
  /* prettier-ignore */ private get disabled() { return asAttr(this.control()?.disabled); }
  /* prettier-ignore */ private get empty() { return asAttr(['', null, undefined].includes(this.control()?.value)); }

  protected get errors() {
    const errors = this.control()?.errors ?? {};
    return Object.entries(errors)
      .map(([name, value]) => {
        const template = this.errorTemplates().find((t) => t.errorName() === name);
        if (template) return { template: template.template, context: { $implicit: value } };

        let pattern = this.formErrors[name] ?? '';
        for (const key in value) pattern = pattern.replace(new RegExp(`{{${key}}}`, 'gim'), value[key]);
        pattern = pattern.replace(new RegExp(`{{#}}`, 'gim'), value);
        return pattern;
      })
      .filter(Boolean);
  }

  protected get showErrors() {
    return this.dirty === '' || this.touched === '';
  }

  constructor() {
    /** Listen for input value/state changes and trigger a change detection accordingly. Useful for things like errors mainly. */
    merge(
      toObservable(this.control).pipe(switchMap((c) => c?.valueChanges ?? EMPTY)),
      toObservable(this.control).pipe(switchMap((c) => c?.statusChanges ?? EMPTY)),
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cd.markForCheck());
  }

  protected isTemplateError(error: any): error is { template: TemplateRef<any>; context: any } {
    return error.context;
  }
}

/** Component that acts as a type switch on the input. By default, it will swap between text & password. */
@Component({
  selector: 'ui-type-switch',
  template: ` <button (click)="switch()">{{ typesMap[type()] }}</button> `,
})
export class FormFieldTypeSwitchComponent {
  private field = ensureParentField();
  types = input<string[]>(['text', 'password']);
  type = computed(() => this.field.input()?.type() ?? 'text');

  /** @internal icons to display in the button, according to the type of the input */
  protected typesMap: Record<string, string> = {
    text: '🔒',
    password: '🔓',
  };

  switch() {
    const types = this.types();
    const type = this.field.input()?.type();
    if (!type) return;
    const index = types.indexOf(type);
    const next = types[(index + 1) % types.length];
    if (!next) return;
    this.field.input()?.type.set(next);
  }
}

/** Directive that binds to the form control of the form field, and is responsible for 90% of the features */
@Directive({ selector: '[ui-input]', host: { '[id]': 'id()', '[type]': 'type()' } })
export class FormFieldInputDirective {
  private field = ensureParentField();
  public ngControl = inject(NgControl, { optional: true });
  public id = input(Math.random().toString(36).slice(2));
  public type = model<string>('text');

  ngDoCheck() {
    // ? Required for interactions with the input (e.g. focus & blur)
    this.field.cd.markForCheck();
  }
}

/** Directive that is used to bind the label to the input (you don't need to set the "for" attribute & invent an ID for your input) */
@Directive({ selector: '[ui-label]', host: { '[for]': 'field.input().id()' } })
export class FormFieldLabelDirective {
  private field = ensureParentField();
}

/** Directive used to provide a custom template for a given form field error */
@Directive({ selector: '[ui-error]' })
export class FormFieldErrorDirective {
  private field = ensureParentField();
  public template = inject(TemplateRef);
  public errorName = input.required<string>({ alias: 'ui-error' });
}

/** Styling & HTML structure directive */
@Directive({ selector: '[ui-zone]' })
export class FormFieldZoneDirective {
  private field = ensureParentField();
  public zone = input.required<FormFieldZones>({ alias: 'ui-zone' });
}

const features = [
  FormFieldComponent,
  FormFieldTypeSwitchComponent,
  FormFieldInputDirective,
  FormFieldErrorDirective,
  FormFieldLabelDirective,
  FormFieldZoneDirective,
];

@NgModule({ imports: [NgTemplateOutlet], declarations: features, exports: features })
export class FormFieldModule {}

/** @internal Function that ensures all the features of the form field are written inside a form field */
function ensureParentField() {
  const field = inject(FormFieldComponent);
  if (!field) throw new Error('Directive must be used inside a FormFieldComponent');
  return field;
}

/** @internal convert a boolean to a normalized attribute (true → `<span data-attr>` instead of `<span data-attr="true">`, false → `<span>` instead of `<span data-attr="false">`) */
function asAttr(value: boolean | undefined | null) {
  return value ? '' : null;
}
