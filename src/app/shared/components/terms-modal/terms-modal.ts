import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** Popup informativo con el resumen de tratamiento de datos. Se abre vía `open()` desde el padre. */
@Component({
  selector: 'app-terms-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        (click)="close()"
      >
        <div
          class="card flex max-h-[80vh] w-full max-w-md flex-col gap-3 overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <h2 class="text-xl font-bold tracking-tight text-[var(--color-primary-strong)]">
            Términos y tratamiento de datos
          </h2>

          <p class="text-sm text-[var(--color-text)] opacity-90">
            Al crear una cuenta en LostAnimals recolectamos tu nombre, correo, teléfono y número de cédula
            para identificarte dentro de la comunidad y permitir el contacto entre reportes de mascotas
            perdidas y avistamientos.
          </p>
          <p class="text-sm text-[var(--color-text)] opacity-90">
            Tratamos tus datos personales conforme a la Ley 1581 de 2012 de Colombia sobre protección de
            datos personales. Puedes conocer, actualizar, rectificar o solicitar la eliminación de tus
            datos en cualquier momento.
          </p>
          <p class="text-sm text-[var(--color-text)] opacity-90">
            Tus datos no se comparten con terceros distintos a los necesarios para operar el servicio (por
            ejemplo, almacenamiento de imágenes o envío de notificaciones), y se conservan mientras
            mantengas tu cuenta activa.
          </p>
          <p class="text-xs text-[var(--color-text)] opacity-60">
            Este resumen es informativo y puede actualizarse; no reemplaza un documento legal completo.
          </p>

          <button type="button" (click)="close()" class="btn btn-primary mt-1">Entendido</button>
        </div>
      </div>
    }
  `,
})
export class TermsModal {
  protected readonly isOpen = signal(false);

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
