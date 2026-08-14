import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingStore } from '../../../../core/onboarding/onboarding.store';
import { NavIcon, NavIconName } from '../../../../shared/components/nav-icon/nav-icon';

interface Slide {
  icon: NavIconName | null;
  accent: 'primary' | 'secondary' | 'accent';
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    icon: null,
    accent: 'primary',
    title: 'Bienvenido a LostAnimals',
    description:
      'La comunidad que ayuda a reunir mascotas perdidas con sus dueños. Te mostramos en unos segundos cómo funciona.',
  },
  {
    icon: 'home',
    accent: 'primary',
    title: 'Busca mascotas perdidas',
    description:
      'En Inicio encuentras los reportes de mascotas perdidas cerca de ti. Filtra por especie, ubicación y fecha.',
  },
  {
    icon: 'megaphone',
    accent: 'accent',
    title: '¿Perdiste a tu mascota?',
    description:
      'Repórtala en pocos pasos: datos básicos, ubicación y fotos. Tu reporte queda visible para toda la comunidad.',
  },
  {
    icon: 'eye',
    accent: 'secondary',
    title: '¿Viste un animal suelto?',
    description:
      'Repórtalo como avistamiento aunque no sea tuyo. Si alguien más ya reportó algo parecido cerca, te avisamos antes de publicar.',
  },
  {
    icon: 'paper-airplane',
    accent: 'primary',
    title: 'Conecta y reencuéntrense',
    description:
      'Solicita contacto sobre un reporte o avistamiento y coordina el reencuentro por mensajes, directo en la app.',
  },
];

@Component({
  selector: 'app-onboarding-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NavIcon],
  host: {
    class: 'fixed inset-0 z-50 flex flex-col bg-[var(--color-background)]',
  },
  template: `
    <div class="mx-auto flex w-full max-w-sm justify-end px-5 pt-[calc(1rem+var(--safe-area-top))]">
      @if (!isLast()) {
        <button type="button" (click)="finish()" class="btn-link text-sm">Saltar</button>
      }
    </div>

    <div
      class="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-8 text-center"
      (touchstart)="onTouchStart($event)"
      (touchend)="onTouchEnd($event)"
    >
      <div class="relative flex h-28 w-28 items-center justify-center">
        <div class="absolute -inset-6 rounded-full opacity-30 blur-2xl" [class]="circleClass()"></div>
        @if (slide().icon; as icon) {
          <div class="relative flex h-28 w-28 items-center justify-center rounded-full shadow-[0_12px_30px_rgba(47,54,59,0.18)]" [class]="circleClass()">
            <app-nav-icon [name]="icon" class="h-14 w-14" />
          </div>
        } @else {
          <div
            class="relative flex h-28 w-28 items-center justify-center rounded-full text-4xl shadow-[0_12px_30px_rgba(47,54,59,0.18)]"
            [class]="circleClass()"
          >
            🐾
          </div>
        }
      </div>

      <div class="flex flex-col gap-3">
        <h1 class="text-2xl font-bold tracking-tight text-[var(--color-primary-strong)]">
          {{ slide().title }}
        </h1>
        <p class="max-w-xs text-sm text-[var(--color-text)] opacity-80">
          {{ slide().description }}
        </p>
      </div>
    </div>

    <div class="mx-auto flex w-full max-w-sm flex-col gap-4 px-6 pb-[calc(1.5rem+var(--safe-area-bottom))]">
      <div class="flex items-center justify-center gap-2">
        @for (s of slides; track $index) {
          <span
            class="h-2 rounded-full transition-all"
            [class]="$index === index() ? 'w-6 bg-[var(--color-primary-strong)]' : 'w-2 bg-[var(--color-surface)]'"
          ></span>
        }
      </div>

      <div class="flex items-center justify-between gap-3">
        <button
          type="button"
          (click)="previous()"
          class="btn btn-ghost"
          [class.invisible]="index() === 0"
        >
          Atrás
        </button>

        @if (!isLast()) {
          <button type="button" (click)="next()" class="btn btn-primary">Siguiente</button>
        } @else {
          <button type="button" (click)="finish()" class="btn btn-primary">Comenzar</button>
        }
      </div>
    </div>
  `,
})
export class OnboardingPage {
  private readonly onboarding = inject(OnboardingStore);
  private readonly router = inject(Router);

  protected readonly slides = SLIDES;
  protected readonly index = signal(0);
  protected readonly slide = signal(SLIDES[0]);
  protected readonly isLast = signal(false);

  private touchStartX = 0;

  constructor() {
    this.goTo(0);
  }

  protected next(): void {
    this.goTo(this.index() + 1);
  }

  protected previous(): void {
    this.goTo(this.index() - 1);
  }

  protected finish(): void {
    this.onboarding.markSeen();
    this.router.navigateByUrl('/');
  }

  protected onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].clientX;
  }

  protected onTouchEnd(event: TouchEvent): void {
    const deltaX = event.changedTouches[0].clientX - this.touchStartX;
    const SWIPE_THRESHOLD = 40;
    if (deltaX <= -SWIPE_THRESHOLD) {
      this.next();
    } else if (deltaX >= SWIPE_THRESHOLD) {
      this.previous();
    }
  }

  protected circleClass(): string {
    switch (this.slide().accent) {
      case 'accent':
        return 'bg-[var(--color-primary)] text-[var(--color-on-primary)]';
      case 'secondary':
        return 'bg-[var(--color-secondary-strong)] text-[var(--color-on-secondary)]';
      default:
        return 'bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]';
    }
  }

  private goTo(nextIndex: number): void {
    const clamped = Math.max(0, Math.min(nextIndex, this.slides.length - 1));
    this.index.set(clamped);
    this.slide.set(this.slides[clamped]);
    this.isLast.set(clamped === this.slides.length - 1);
  }
}
