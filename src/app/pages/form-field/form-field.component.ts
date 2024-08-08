import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormFieldModule } from '@snippets/forms/form-field/form-field.scam';

@Component({
  selector: 'snip-form-field',
  standalone: true,
  imports: [FormFieldModule, ReactiveFormsModule],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class FormFieldComponent {
  control = new FormControl('', [Validators.required, Validators.minLength(5), Validators.maxLength(8)]);
  password = '';
}
