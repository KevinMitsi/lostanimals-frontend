import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

interface SafetySlide {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
}

const SLIDES: readonly SafetySlide[] = [
  {
    icon: '⚠️',
    title: 'Antes de continuar',
    body: 'Aceptaste una solicitud de contacto. Lamentablemente existen personas que intentan aprovecharse de quienes buscan reencontrar o ayudar a una mascota. Mantén la precaución durante toda la conversación.',
  },
  {
    icon: '🔒',
    title: 'No compartas información sensible',
    body: 'Evita enviar contraseñas, datos bancarios, números de tarjetas o tu dirección exacta por el chat, sin importar qué tan confiable parezca la otra persona.',
  },
  {
    icon: '🤝',
    title: 'Si van a verse en persona',
    body: 'Elige un lugar público y concurrido, ve acompañado y avísale a alguien de confianza dónde y con quién te vas a encontrar. Toma todas las precauciones necesarias.',
  },
];

/**
 * Popup de varios slides con advertencias de seguridad, mostrado justo después de aceptar
 * una solicitud de contacto (antes de entrar a la conversación). No tiene cierre por click
 * fuera del recuadro: hay que recorrer los slides y confirmar, para asegurar que se lea.
 */
@Component({
  selector: 'app-safety-warning-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
        <div class="card flex w-full max-w-sm flex-col gap-4">
          <div class="flex flex-col items-center gap-2 text-center">
            <span class="text-4xl">{{ slides[slideIndex()].icon }}</span>
            <h2 class="text-lg font-bold tracking-tight text-[var(--color-alert-strong)]">
              {{ slides[slideIndex()].title }}
            </h2>
            <p class="text-sm text-[var(--color-text)]">{{ slides[slideIndex()].body }}</p>
          </div>

          <div class="flex justify-center gap-1.5">
            @for (slide of slides; track $index) {
              <span
                class="h-1.5 rounded-full transition-all"
                [class]="$index === slideIndex() ? 'w-4 bg-[var(--color-primary-strong)]' : 'w-1.5 bg-[var(--color-surface)]'"
              ></span>
            }
          </div>

          <div class="flex gap-2">
            @if (slideIndex() > 0) {
              <button type="button" (click)="previous()" class="btn btn-ghost flex-1">Atrás</button>
            }
            @if (slideIndex() < slides.length - 1) {
              <button type="button" (click)="next()" class="btn btn-primary flex-1">Siguiente</button>
            } @else {
              <button type="button" (click)="confirm()" class="btn btn-primary flex-1">Entendido, continuar</button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class SafetyWarningModal {
  protected readonly slides = SLIDES;
  protected readonly isOpen = signal(false);
  protected readonly slideIndex = signal(0);

  readonly confirmed = output<void>();

  open(): void {
    this.slideIndex.set(0);
    this.isOpen.set(true);
  }

  protected next(): void {
    this.slideIndex.update((i) => Math.min(i + 1, this.slides.length - 1));
  }

  protected previous(): void {
    this.slideIndex.update((i) => Math.max(i - 1, 0));
  }

  protected confirm(): void {
    this.isOpen.set(false);
    this.confirmed.emit();
  }
}
