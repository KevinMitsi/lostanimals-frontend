import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

const STORAGE_KEY = 'lostanimals.ageConfirmed';

/**
 * Aviso de edad mínima, mostrado la primera vez que alguien entra a la app (persistido en
 * localStorage, no por sesión). Bloquea toda la interfaz sin opción de cerrar por fuera:
 * solo se sale confirmando la edad o abandonando la app.
 */
@Component({
  selector: 'app-age-gate-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
        <div class="flex w-full max-w-md flex-col gap-4 rounded-3xl bg-white p-6 text-center shadow-[0_8px_40px_rgba(0,0,0,0.3)] sm:p-8">
          <span class="text-5xl">🔞</span>
          <h2 class="text-2xl font-bold tracking-tight text-[var(--color-alert-strong)]">
            Solo para mayores de 18 años
          </h2>
          <p class="text-sm text-[var(--color-text)]">
            Por las restricciones de esta app —incluyendo que habilita chats con personas
            desconocidas para coordinar reencuentros de mascotas— es necesario que confirmes
            que eres mayor de edad para poder ingresar.
          </p>

          <div class="mt-2 flex flex-col gap-2">
            <button type="button" (click)="confirm()" class="btn btn-primary">
              Sí, soy mayor de 18 años, entrar
            </button>
            <button type="button" (click)="exit()" class="btn btn-alert">No, salir</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AgeGateModal {
  protected readonly isOpen = signal(this.shouldShow());

  private shouldShow(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== 'true';
    } catch {
      return true;
    }
  }

  protected confirm(): void {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Si el navegador bloquea localStorage (modo privado, etc.), simplemente se preguntará de nuevo.
    }
    this.isOpen.set(false);
  }

  protected exit(): void {
    window.close();
    window.location.href = 'https://www.google.com';
  }
}
