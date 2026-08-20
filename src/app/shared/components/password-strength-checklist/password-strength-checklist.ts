import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface Requirement {
  label: string;
  met: boolean;
}

/** Lista de requisitos de contraseña que se van marcando en verde a medida que se cumplen. */
@Component({
  selector: 'app-password-strength-checklist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col gap-1.5 rounded-2xl !p-3 text-xs shadow-[0_8px_24px_rgba(47,54,59,0.16)] transition-colors"
      [style.background]="allMet() ? 'color-mix(in srgb, var(--color-secondary) 30%, white)' : 'var(--color-surface)'"
    >
      @if (allMet()) {
        <div class="flex items-center gap-2 font-semibold text-[var(--color-secondary-strong)]">
          <span>✓</span> ¡Contraseña válida!
        </div>
      } @else {
        @for (requirement of requirements(); track requirement.label) {
          <div
            class="flex items-center gap-2"
            [class]="
              requirement.met
                ? 'font-semibold text-[var(--color-secondary-strong)]'
                : 'text-[var(--color-text)] opacity-60'
            "
          >
            <span class="w-3 text-center">{{ requirement.met ? '✓' : '·' }}</span>
            {{ requirement.label }}
          </div>
        }
      }
    </div>
  `,
})
export class PasswordStrengthChecklist {
  readonly password = input('');

  protected readonly requirements = computed<Requirement[]>(() => {
    const value = this.password();
    return [
      { label: 'Mínimo 12 caracteres', met: value.length >= 12 },
      { label: 'Máximo 72 caracteres', met: value.length <= 72 },
      { label: 'Una letra mayúscula', met: /[A-Z]/.test(value) },
      { label: 'Una letra minúscula', met: /[a-z]/.test(value) },
      { label: 'Un número', met: /\d/.test(value) },
    ];
  });

  protected readonly allMet = computed(() => this.requirements().every((r) => r.met));
}
