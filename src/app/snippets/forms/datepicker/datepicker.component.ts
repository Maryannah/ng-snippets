import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID, output, signal } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

const firstWeekday = 1; // Sunday = 0
const dayLength = 24 * 60 * 60 * 1000;
const normalizedHour = 0; // Hour of the day to set when normalizing a date
const today = new Date().getTime();

/** Type that simplifies date normalization & creation for the whole feature */
type DateLike = Date | string | number;

/** Creates a normalized date while being fail-proof */
export function toDate(value: DateLike = new Date(), throwError = true): Date | null {
  if (!value) return null;
  const date = new Date(value).setHours(normalizedHour, 0, 0, 0);
  if (isNaN(date))
    if (throwError) throw new Error('toDate : value provided is not a valid Date');
    else return null;
  return new Date(date);
}

@Component({
  selector: 'ui-datepicker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    @let preview = previewDate();
    @let mode = viewMode();
    @let disableIncrements = mode === 'month';

    <div class="__header">
      <button (click)="viewMode.set('year')">
        {{ preview.getFullYear() }}
      </button>
      <span style="flex: 1 1 0%"></span>
      <button (click)="viewMode.set('month')">
        {{ months[preview.getMonth()] || '' }}
      </button>
      <span style="flex: 1 1 0%"></span>
      <button [disabled]="disableIncrements" (click)="increment(0)">⬆️</button>
      <button [disabled]="disableIncrements" (click)="increment(-1)">⬇️</button>
    </div>
    @if (mode === 'day') {
      <div class="__calendar">
        @for (day of days; track day) {
          <span>{{ day.slice(0, 3) }}</span>
        }
        @for (day of calendarView(); track day.getTime()) {
          @let isFiller = day.getMonth() !== preview.getMonth();
          @let label = ('' + day.getDate()).padStart(2, '0');
          @let isCurrent = controlValue.getTime() === day.getTime();

          <button [class.__filler]="isFiller" [class.__selected]="isCurrent" (click)="selectDate(day)">
            {{ label }}
          </button>
        }
      </div>
    } @else if (mode === 'month') {
      <div class="__months">
        @for (month of months; track month) {
          @let isCurrent = $index === controlValue.getMonth();

          <button (click)="selectMonth($index)" [class.__selected]="isCurrent">{{ month }}</button>
        }
      </div>
    } @else if (mode === 'year') {
      <div class="__years">
        @for (year of years(); track year) {
          @let isCurrent = year === controlValue.getFullYear();

          <button (click)="selectYear(year)" [class.__selected]="isCurrent">{{ year }}</button>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: inline-block;

      .__header,
      .__calendar,
      .__months,
      .__years {
        padding: 0.5rem;
        border: 1px solid black;

        > button {
          padding: 0.5rem;
          text-transform: capitalize;

          &.__selected {
            font-weight: bold;
            background-color: black;
            color: white;
          }

          &.__filler {
            opacity: 0.25;
          }
        }
      }

      .__header {
        display: flex;
        flex-flow: row;
        align-items: center;
        justify-content: flex-start;
        gap: 0.5rem;
        margin-bottom: -1px;

        button {
          font-weight: bold;
        }
      }

      .__calendar {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        place-items: center;
        gap: 0.5rem;

        span {
          font-weight: bold;
          text-transform: capitalize;
          padding: 0.5rem;
        }
      }

      .__months {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        place-items: center;
        gap: 0.5rem;
      }

      .__years {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        place-items: center;
        gap: 0.5rem;
      }
    }
  `,
})
export class DatepickerComponent implements ControlValueAccessor {
  private locale = inject(LOCALE_ID, { optional: true }) ?? 'en-US';

  private dayParser = Intl.DateTimeFormat(this.locale, { weekday: 'long' });
  private monthParser = Intl.DateTimeFormat(this.locale, { month: 'long' });

  /** @internal days of the week, translated according to the provided locale */
  protected days = Array.from({ length: 7 }, (_, i) => toDate(today + i * dayLength)!)
    .sort((a, b) => ((a.getDay() + 7 - firstWeekday) % 7) - ((b.getDay() + 7 - firstWeekday) % 7))
    .map((d) => this.dayParser.format(d).toLocaleLowerCase());

  /** @internal months of the year, translated according to the provided locale */
  protected months = Array.from({ length: 12 }, (_, i) => toDate(toDate(today)!.setMonth(i))!).map((d) =>
    this.monthParser.format(d).toLocaleLowerCase(),
  );

  private ngControl = inject(NgControl, { optional: true });
  protected get controlValue() {
    return toDate(this.ngControl?.value ?? null, false) ?? this.previewDate();
  }

  /** @internal number of years to display when in year mode */
  private yearsPerView = 25;

  /** @internal Date that controls the user view */
  protected previewDate = signal<Date>(toDate()!);
  protected viewMode = signal<'month' | 'year' | 'day'>('day');

  protected disabled = signal(false);
  protected change?: (value: DateLike) => void;
  protected touch?: () => void;

  /** @internal all of the days of the currently viewed month */
  protected calendarView = computed(() => {
    const date = this.previewDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const length = new Date(year, month + 1, 0).getDate();
    const calendar = Array.from({ length }, (_, i) => toDate(new Date(year, month, i + 1))!);
    while (calendar.at(0)!.getDay() !== firstWeekday)
      calendar.unshift(toDate(toDate(calendar.at(0)!)!.setDate(calendar.at(0)!.getDate() - 1))!);
    while (calendar.at(-1)!.getDay() !== (firstWeekday + 6) % 7)
      calendar.push(toDate(toDate(calendar.at(-1)!)!.setDate(calendar.at(-1)!.getDate() + 1))!);
    return calendar;
  });

  /** @internal all of the years to display in the year view */
  protected years = computed(() => {
    const year = this.previewDate().getFullYear();
    return Array.from({ length: this.yearsPerView }, (_, i) => year + i - Math.floor(this.yearsPerView / 2));
  });

  /** Emits a date when the user picks one */
  public dateChange = output<Date>();

  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
  }

  /** @internal arrow buttons that move the day/year view from a given offset */
  protected increment(value: 0 | -1) {
    if (this.viewMode() === 'day') {
      const boundary = toDate(this.calendarView().at(value)!)!;
      const nextDate = boundary.getTime() + (value ? dayLength : -dayLength);
      this.previewDate.set(toDate(nextDate)!);
    } else if (this.viewMode() === 'year') {
      const offset = this.years().at(value)!;
      const boundary = toDate(this.previewDate())!;
      const nextDate = boundary.setFullYear(offset + Math.ceil(this.yearsPerView / 2) * (value ? 1 : -1));
      console.log(toDate(nextDate));
      this.previewDate.set(toDate(nextDate)!);
    }
  }

  protected selectMonth(month: number) {
    const nextDate = toDate(this.previewDate())!.setMonth(month);
    this.previewDate.set(toDate(nextDate)!);
    this.viewMode.set('day');
  }

  protected selectYear(year: number) {
    const nextDate = toDate(this.previewDate())!.setFullYear(year);
    this.previewDate.set(toDate(nextDate)!);
    this.viewMode.set('month');
  }

  protected selectDate(date: Date) {
    this.previewDate.set(date);
    this.change?.(date);
    this.dateChange.emit(date);
  }

  registerOnChange = (fn: () => void) => (this.change = fn);
  registerOnTouched = (fn: () => void) => (this.touch = fn);
  setDisabledState = (isDisabled: boolean) => this.disabled.set(isDisabled);
  writeValue = (obj: DateLike): void => this.previewDate.set(toDate(obj, true)!);
}
