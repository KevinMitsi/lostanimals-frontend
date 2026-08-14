import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { EditLostPetReportRequest, LostPetReportResponse } from '../../../../core/models';
import { ImageUploadService } from '../../../../core/upload/image-upload.service';
import {
  GeographyCascadeSelector,
  GeographyLocationValue,
} from '../../../../shared/components/geography-cascade-selector/geography-cascade-selector';
import { LostPetReportService } from '../../lost-pet-report.service';

@Component({
  selector: 'app-report-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, GeographyCascadeSelector],
  template: `
    @if (report(); as report) {
      <div class="mx-auto flex max-w-xl flex-col gap-5 px-4 py-6">
        <h1 class="text-2xl font-semibold text-[var(--color-primary-strong)]">Editar reporte</h1>

        @if (formError()) {
          <p class="rounded-md bg-[var(--color-alert)] px-3 py-2 text-sm text-[var(--color-on-alert)]">
            {{ formError() }}
          </p>
          @if (conflict()) {
            <button type="button" (click)="reload(report.id)" class="text-sm font-semibold text-[var(--color-primary-strong)]">
              Recargar datos
            </button>
          }
        }

        <form [formGroup]="form" (ngSubmit)="submit(report.id)" class="flex flex-col gap-4">
          <label class="flex flex-col gap-1 text-sm">
            Nombre de la mascota
            <input formControlName="petName" class="min-h-[44px] rounded-md border border-[var(--color-surface)] bg-white px-3" />
          </label>

          <label class="flex flex-col gap-1 text-sm">
            Especie
            <select formControlName="species" class="min-h-[44px] rounded-md border border-[var(--color-surface)] bg-white px-3">
              <option value="DOG">Perro</option>
              <option value="CAT">Gato</option>
              <option value="BIRD">Ave</option>
              <option value="OTHER">Otro</option>
            </select>
          </label>

          <label class="flex flex-col gap-1 text-sm">
            Descripción
            <textarea
              formControlName="description"
              rows="4"
              class="rounded-md border border-[var(--color-surface)] bg-white px-3 py-2"
            ></textarea>
          </label>

          <label class="flex flex-col gap-1 text-sm">
            Fecha y hora en que desapareció
            <input
              type="datetime-local"
              formControlName="disappearedAt"
              class="min-h-[44px] rounded-md border border-[var(--color-surface)] bg-white px-3"
            />
          </label>

          <div class="flex flex-col gap-1">
            <span class="text-sm">Ubicación</span>
            <p class="text-xs text-[var(--color-text)] opacity-70">
              Se mantiene la ubicación actual. El backend no permite recuperar el departamento/ciudad de un
              barrio ya guardado, así que si quieres cambiarla vuelve a elegir los tres campos.
            </p>
            <app-geography-cascade-selector formControlName="location" />
          </div>

          <button
            type="submit"
            [disabled]="submitting()"
            class="min-h-[44px] rounded-md bg-[var(--color-primary-strong)] px-4 text-[var(--color-on-primary)] disabled:opacity-60"
          >
            {{ submitting() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </form>

        <div class="flex flex-col gap-2">
          <h2 class="text-lg font-semibold text-[var(--color-primary-strong)]">Imágenes</h2>

          <div class="flex flex-wrap gap-3">
            @for (image of report.images; track image.id) {
              <div class="relative h-24 w-24 overflow-hidden rounded-md border border-[var(--color-surface)]">
                <img [src]="image.url" alt="" class="h-full w-full object-cover" />
                @if (image.primary) {
                  <span class="absolute left-1 top-1 rounded bg-[var(--color-primary-strong)] px-1 text-[10px] text-white">
                    Principal
                  </span>
                }
                <div class="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1">
                  @if (!image.primary) {
                    <button
                      type="button"
                      (click)="setPrimary(report.id, image.id)"
                      class="text-[10px] text-white underline"
                    >
                      Hacer principal
                    </button>
                  }
                  <button
                    type="button"
                    [disabled]="report.images.length <= 1"
                    (click)="deleteImage(report.id, image.id)"
                    class="ml-auto text-[10px] text-white underline disabled:opacity-40"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            }

            @if (report.images.length < 5) {
              <label
                class="flex h-24 w-24 min-h-[44px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-[var(--color-surface)] text-xs"
              >
                + Foto
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  capture="environment"
                  class="hidden"
                  (change)="addImage(report.id, $any($event.target).files)"
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
export class ReportEditPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reportService = inject(LostPetReportService);
  private readonly uploadService = inject(ImageUploadService);

  protected readonly report = signal<LostPetReportResponse | undefined>(undefined);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly conflict = signal(false);
  protected readonly imageError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    petName: ['', [Validators.required, Validators.maxLength(80)]],
    species: ['DOG'],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    disappearedAt: ['', [Validators.required]],
    location: this.fb.nonNullable.control<GeographyLocationValue>({
      departmentId: null,
      cityId: null,
      neighborhoodId: null,
    }),
  });

  constructor() {
    this.reload(this.route.snapshot.paramMap.get('id')!);
  }

  protected reload(reportId: string): void {
    this.formError.set(null);
    this.conflict.set(false);

    this.reportService.getById(reportId).subscribe({
      next: (report) => {
        this.report.set(report);
        this.form.patchValue({
          petName: report.petName,
          species: report.species,
          description: report.description,
          disappearedAt: report.disappearedAt.slice(0, 16),
          location: { departmentId: null, cityId: null, neighborhoodId: report.neighborhoodId },
        });
      },
      error: () => this.formError.set('No se pudo cargar el reporte.'),
    });
  }

  protected submit(reportId: string): void {
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

    const request: EditLostPetReportRequest = {
      petName: value.petName,
      species: value.species as EditLostPetReportRequest['species'],
      description: value.description,
      disappearedAt: new Date(value.disappearedAt).toISOString(),
      latitude: this.report()!.latitude,
      longitude: this.report()!.longitude,
      neighborhoodId: value.location.neighborhoodId,
    };

    this.submitting.set(true);
    this.reportService.edit(reportId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/lost-pet-reports', reportId]);
      },
      error: (error: AppApiError) => {
        this.submitting.set(false);
        if (error.status === 409) {
          this.conflict.set(true);
          this.formError.set('Este reporte cambió mientras lo editabas. Recarga antes de reintentar.');
        } else {
          this.formError.set(error.detail);
        }
      },
    });
  }

  protected addImage(reportId: string, fileList: FileList | null): void {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    this.imageError.set(null);

    this.uploadService.uploadImage(this.reportService.basePath, file).subscribe({
      next: (uploaded) => {
        this.reportService.attachImage(reportId, { objectKey: uploaded.objectKey }).subscribe({
          next: () => this.reload(reportId),
          error: (error: AppApiError) => this.imageError.set(error.detail),
        });
      },
      error: (error: unknown) => {
        this.imageError.set(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
      },
    });
  }

  protected deleteImage(reportId: string, imageId: string): void {
    this.imageError.set(null);
    this.reportService.deleteImage(reportId, imageId).subscribe({
      next: () => this.reload(reportId),
      error: (error: AppApiError) => this.imageError.set(error.detail),
    });
  }

  protected setPrimary(reportId: string, imageId: string): void {
    this.imageError.set(null);
    this.reportService.setPrimaryImage(reportId, imageId).subscribe({
      next: () => this.reload(reportId),
      error: (error: AppApiError) => this.imageError.set(error.detail),
    });
  }
}
