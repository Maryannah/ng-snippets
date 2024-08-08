import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DatepickerComponent } from '@snippets/forms/datepicker/datepicker.component';

@Component({
  selector: 'snip-datepicker',
  standalone: true,
  imports: [DatepickerComponent, ReactiveFormsModule],
  templateUrl: './datepicker.component.html',
  styleUrl: './datepicker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DatepickerDemoComponent {
  control = new FormControl(new Date());
}
