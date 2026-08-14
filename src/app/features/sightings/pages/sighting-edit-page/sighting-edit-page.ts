import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { EditSightingRequest, SightingResponse } from '../../../../core/models';
import { ImageUploadService } from '../../../../core/upload/image-upload.service';
import {
  GeographyCascadeSelector,
  GeographyLocationValue,
} from '../../../../shared/components/geography-cascade-selector/geography-cascade-selector';
import { SightingService } from '../../sighting.service';

@Component({
  selector: 'app-sighting-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, GeographyCascadeSelector],
  template: `
    @if (sighting(); as sighting) {
      <div class="mx-auto flex max-w-xl flex-col gap-5 px-4 py-6">
        <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Editar avistamiento</h1>

        @if (formError()) {
          <p class="banner-alert">{{ formError() }}</p>
          @if (conflict()) {
            <button type="button" (click)="reload(sighting.id)" class="btn-link">Recargar datos</button>
          }
        }

        <form [formGroup]="form" (ngSubmit)="submit(sighting.id)" class="card flex flex-col gap-4">
          <label class="field-label">
            Especie
            <select formControlName="species" class="field-input">
              <option value="DOG">Perro</option>
              <option value="CAT">Gato</option>
              <option value="BIRD">Ave</option>
              <option value="OTHER">Otro</option>
            </select>
          </label>

          <label class="field-label">
            Descripción
            <textarea formControlName="description" rows="4" class="field-textarea"></textarea>
          </label>

          <label class="field-label">
            Fecha y hora en que lo viste
            <input type="datetime-local" formControlName="observedAt" class="field-input" />
          </label>

          <div class="flex flex-col gap-1">
            <span class="text-sm">Ubicación</span>
            <p class="text-xs text-[var(--color-text)] opacity-70">
              Se mantiene la ubicación actual. El backend no permite recuperar el departamento/ciudad de un
              barrio ya guardado, así que si quieres cambiarla vuelve a elegir los tres campos.
            </p>
            <app-geography-cascade-selector formControlName="location" />
          </div>

          <button type="submit" [disabled]="submitting()" class="btn btn-primary">
            {{ submitting() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </form>

        <div class="card flex flex-col gap-3">
          <h2 class="text-xl font-bold tracking-tight text-[var(--color-primary-strong)]">Imágenes</h2>

          <div class="flex flex-wrap gap-3">
            @for (image of sighting.images; track image.id) {
              <div class="relative h-24 w-24 overflow-hidden rounded-2xl shadow-[0_2px_10px_rgba(47,54,59,0.1)]">
                <img [src]="image.url" alt="" class="h-full w-full object-cover" />
                @if (image.primary) {
                  <span class="absolute left-1 top-1 rounded bg-[var(--color-primary-strong)] px-1 text-[10px] text-white">
                    Principal
                  </span>
                }
                <div class="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1">
                  @if (!image.primary) {
                    <button type="button" (click)="setPrimary(sighting.id, image.id)" class="text-[10px] text-white underline">
                      Hacer principal
                    </button>
                  }
                  <button
                    type="button"
                    [disabled]="sighting.images.length <= 1"
                    (click)="deleteImage(sighting.id, image.id)"
                    class="ml-auto text-[10px] text-white underline disabled:opacity-40"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            }

            @if (sighting.images.length < 5) {
              <label
                class="flex h-24 w-24 min-h-[44px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-surface)] text-xs transition hover:border-[var(--color-primary)]"
              >
                + Foto
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  capture="environment"
                  class="hidden"
                  (change)="addImage(sighting.id, $any($event.target).files)"
                />
              </label>
            }
          </div>

          @if (imageError()) {
            <p class="text-xs text-[var(--color-alert-strong)]">{{ imageError() }}</p>
          }
        </div>
      </div>
    } @else {
      <p class="px-4 py-12 text-center text-sm text-[var(--color-text)]">Cargando…</p>
    }
  `,
})
export class SightingEditPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sightingService = inject(SightingService);
  private readonly uploadService = inject(ImageUploadService);

  protected readonly sighting = signal<SightingResponse | undefined>(undefined);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly conflict = signal(false);
  protected readonly imageError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    species: ['DOG'],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    observedAt: ['', [Validators.required]],
    location: this.fb.nonNullable.control<GeographyLocationValue>({
      departmentId: null,
      cityId: null,
      neighborhoodId: null,
    }),
  });

  constructor() {
    this.reload(this.route.snapshot.paramMap.get('id')!);
  }

  protected reload(sightingId: string): void {
    this.formError.set(null);
    this.conflict.set(false);

    this.sightingService.getById(sightingId).subscribe({
      next: (sighting) => {
        this.sighting.set(sighting);
        this.form.patchValue({
          species: sighting.species,
          description: sighting.description,
          observedAt: sighting.observedAt.slice(0, 16),
          location: { departmentId: null, cityId: null, neighborhoodId: sighting.neighborhoodId },
        });
      },
      error: () => this.formError.set('No se pudo cargar el avistamiento.'),
    });
  }

  protected submit(sightingId: string): void {
    this.formError.set(null);
    this.conflict.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (!value.location.neighborhoodId) {
      this.formError.set('Selecciona un barrio.');
      return;
    }

    const request: EditSightingRequest = {
      species: value.species as EditSightingRequest['species'],
      description: value.description,
      observedAt: new Date(value.observedAt).toISOString(),
      latitude: this.sighting()!.latitude,
      longitude: this.sighting()!.longitude,
      neighborhoodId: value.location.neighborhoodId,
    };

    this.submitting.set(true);
    this.sightingService.edit(sightingId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/sightings', sightingId]);
      },
      error: (error: AppApiError) => {
        this.submitting.set(false);
        if (error.status === 409) {
          this.conflict.set(true);
          this.formError.set('Este avistamiento cambió mientras lo editabas. Recarga antes de reintentar.');
        } else {
          this.formError.set(error.detail);
        }
      },
    });
  }

  protected addImage(sightingId: string, fileList: FileList | null): void {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    this.imageError.set(null);

    this.uploadService.uploadImage(this.sightingService.basePath, file).subscribe({
      next: (uploaded) => {
        this.sightingService.attachImage(sightingId, { objectKey: uploaded.objectKey }).subscribe({
          next: () => this.reload(sightingId),
          error: (error: AppApiError) => this.imageError.set(error.detail),
        });
      },
      error: (error: unknown) => {
        this.imageError.set(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
      },
    });
  }

  protected deleteImage(sightingId: string, imageId: string): void {
    this.imageError.set(null);
    this.sightingService.deleteImage(sightingId, imageId).subscribe({
      next: () => this.reload(sightingId),
      error: (error: AppApiError) => this.imageError.set(error.detail),
    });
  }

  protected setPrimary(sightingId: string, imageId: string): void {
    this.imageError.set(null);
    this.sightingService.setPrimaryImage(sightingId, imageId).subscribe({
      next: () => this.reload(sightingId),
      error: (error: AppApiError) => this.imageError.set(error.detail),
    });
  }
}
