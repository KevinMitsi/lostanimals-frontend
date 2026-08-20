import { ChangeDetectionStrategy, Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

const DIAL_CODE = '+57';

/**
 * Teléfono con código de país fijo (Colombia, +57) + número sin el "+" literal.
 * El backend solo acepta números colombianos, así que no hay selector real de país:
 * la insignia es fija y solo el campo numérico es editable. El value que emite
 * (y que espera `writeValue`) es el string combinado, ej. "+573001234567".
 */
@Component({
  selector: 'app-phone-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInput),
      multi: true,
    },
  ],
  template: `
    <div class="flex gap-2">
      <span
        class="field-input flex w-[5.5rem] shrink-0 items-center justify-center gap-1 !px-2 text-sm"
        [class.opacity-60]="disabled()"
      >
        🇨🇴 {{ dialCode }}
      </span>
      <input
        type="tel"
        inputmode="numeric"
        autocomplete="tel-national"
        class="field-input flex-1"
        placeholder="3001234567"
        [value]="localNumber()"
        [disabled]="disabled()"
        (input)="onNumberInput($any($event.target).value)"
        (blur)="onTouched()"
      />
    </div>
  `,
})
export class PhoneInput implements ControlValueAccessor {
  protected readonly dialCode = DIAL_CODE;
  protected readonly localNumber = signal('');
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    if (!value) {
      this.localNumber.set('');
      return;
    }
    this.localNumber.set(value.startsWith(DIAL_CODE) ? value.slice(DIAL_CODE.length) : value.replace(/^\+/, ''));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onNumberInput(value: string): void {
    this.localNumber.set(value.replace(/\D/g, ''));
    this.onTouched();
    this.onChange(this.localNumber() ? `${DIAL_CODE}${this.localNumber()}` : '');
  }
}
