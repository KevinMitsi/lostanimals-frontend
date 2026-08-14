import { ChangeDetectionStrategy, Component, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ImageUploadService } from '../../../core/upload/image-upload.service';

interface PickerItem {
  id: string;
  previewUrl: string;
  status: 'uploading' | 'done' | 'error';
  objectKey?: string;
  errorMessage?: string;
}

/**
 * Selector de imágenes con captura de cámara en mobile (1 a `max`, mínimo `min`).
 * Sube cada archivo al elegirlo (checksum + presign + PUT a S3 vía ImageUploadService)
 * y expone como valor de formulario el array ordenado de `objectKey` ya subidos.
 */
@Component({
  selector: 'app-image-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImagePicker),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap gap-3">
        @for (item of items(); track item.id) {
          <div class="relative h-24 w-24 overflow-hidden rounded-2xl shadow-[0_2px_10px_rgba(47,54,59,0.1)]">
            <img [src]="item.previewUrl" alt="" class="h-full w-full object-cover" />
            @if (item.status === 'uploading') {
              <div class="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
                Subiendo…
              </div>
            }
            @if (item.status === 'error') {
              <div class="absolute inset-0 flex items-center justify-center bg-[var(--color-alert)]/90 p-1 text-center text-[10px] text-[var(--color-on-alert)]">
                {{ item.errorMessage }}
              </div>
            }
            <button
              type="button"
              (click)="remove(item.id)"
              aria-label="Quitar imagen"
              class="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
            >
              &times;
            </button>
          </div>
        }

        @if (items().length < max()) {
          <label
            class="flex h-24 w-24 min-h-[44px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-surface)] text-xs text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary-strong)]"
          >
            + Foto
            <input
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              multiple
              class="hidden"
              (change)="onFilesSelected($any($event.target).files)"
            />
          </label>
        }
      </div>

      <p class="text-xs text-[var(--color-text)]">
        {{ items().length }}/{{ max() }} imágenes (mínimo {{ min() }}).
      </p>
    </div>
  `,
})
export class ImagePicker implements ControlValueAccessor {
  readonly resourceBasePath = input.required<string>();
  readonly min = input(1);
  readonly max = input(5);

  private readonly uploadService = inject(ImageUploadService);

  protected readonly items = signal<PickerItem[]>([]);
  private readonly disabled = signal(false);

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(): void {
    // La subida es propia del componente; no se reconstruye estado desde un array de keys externo.
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onFilesSelected(fileList: FileList | null): void {
    if (!fileList || this.disabled()) {
      return;
    }
    this.onTouched();

    const remainingSlots = this.max() - this.items().length;
    const files = Array.from(fileList).slice(0, Math.max(0, remainingSlots));

    for (const file of files) {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      this.items.update((list) => [...list, { id, previewUrl, status: 'uploading' }]);

      this.uploadService.uploadImage(this.resourceBasePath(), file).subscribe({
        next: (uploaded) => {
          this.items.update((list) =>
            list.map((item) => (item.id === id ? { ...item, status: 'done', objectKey: uploaded.objectKey } : item)),
          );
          this.emit();
        },
        error: (error: unknown) => {
          const message = error instanceof Error ? error.message : 'No se pudo subir la imagen.';
          this.items.update((list) =>
            list.map((item) => (item.id === id ? { ...item, status: 'error', errorMessage: message } : item)),
          );
        },
      });
    }
  }

  protected remove(id: string): void {
    const item = this.items().find((i) => i.id === id);
    if (item) {
      URL.revokeObjectURL(item.previewUrl);
    }
    this.items.update((list) => list.filter((i) => i.id !== id));
    this.emit();
  }

  private emit(): void {
    const objectKeys = this.items()
      .filter((item) => item.status === 'done' && item.objectKey)
      .map((item) => item.objectKey!);
    this.onChange(objectKeys);
  }
}
