import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { EditLostPetReportRequest, LostPetReportResponse } from '../../../../core/models';
import { ImageUploadService } from '../../../../core/upload/image-upload.service';
import { notInFutureValidator, nowAsDatetimeLocal } from '../../../../core/validators/validators';
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
        <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Editar reporte</h1>

        @if (formError()) {
          <p class="banner-alert">
            {{ formError() }}
          </p>
          @if (conflict()) {
            <button type="button" (click)="reload(report.id)" class="btn-link">
              Recargar datos
            </button>
          }
        }

        <form [formGroup]="form" (ngSubmit)="submit(report.id)" class="card flex flex-col gap-4">
          <label class="field-label">
            Nombre de la mascota
            <input formControlName="petName" class="field-input" />
          </label>

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
            <textarea
              formControlName="description"
              rows="4"
              class="field-textarea"
            ></textarea>
          </label>

          <label class="field-label">
            Fecha y hora en que desapareció
            <input
              type="datetime-local"
              formControlName="disappearedAt"
              [max]="maxDateTime"
              class="field-input"
            />
            @if (form.controls.disappearedAt.errors?.['futureDate']) {
              <span class="text-xs text-[var(--color-alert-strong)]">
                La fecha no puede ser en el futuro.
              </span>
            }
          </label>

          <div class="flex flex-col gap-1">
            <span class="text-sm">Ubicación</span>
            <app-geography-cascade-selector formControlName="location" />
          </div>

          <button
            type="submit"
            [disabled]="submitting()"
            class="btn btn-primary"
          >
            {{ submitting() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </form>

        <div class="card flex flex-col gap-3">
          <h2 class="text-xl font-bold tracking-tight text-[var(--color-primary-strong)]">Imágenes</h2>

          <div class="flex flex-wrap gap-3">
            @for (image of report.images; track image.id) {
              <div class="relative h-24 w-24 overflow-hidden rounded-2xl shadow-[0_2px_10px_rgba(47,54,59,0.1)]">
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
                class="flex h-24 w-24 min-h-[44px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-surface)] text-xs transition hover:border-[var(--color-primary)]"
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
  protected readonly maxDateTime = nowAsDatetimeLocal();

  protected readonly form = this.fb.nonNullable.group({
    petName: ['', [Validators.required, Validators.maxLength(80)]],
    species: ['DOG'],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    disappearedAt: ['', [Validators.required, notInFutureValidator()]],
    location: this.fb.nonNullable.control<GeographyLocationValue>({
      departmentCode: null,
      municipalityCode: null,
      neighborhood: '',
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
          location: {
            departmentCode: report.departmentCode,
            municipalityCode: report.municipalityCode,
            neighborhood: report.neighborhood,
          },
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
    if (
      !value.location.departmentCode ||
      !value.location.municipalityCode ||
      !value.location.neighborhood.trim()
    ) {
      this.formError.set('Selecciona el departamento y municipio, y escribe el barrio.');
      return;
    }

    const request: EditLostPetReportRequest = {
      petName: value.petName,
      species: value.species as EditLostPetReportRequest['species'],
      description: value.description,
      disappearedAt: new Date(value.disappearedAt).toISOString(),
      latitude: this.report()!.latitude,
      longitude: this.report()!.longitude,
      departmentCode: value.location.departmentCode,
      municipalityCode: value.location.municipalityCode,
      neighborhood: value.location.neighborhood.trim(),
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
