import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { CreateLostPetReportRequest } from '../../../../core/models';
import {
  GeographyCascadeSelector,
  GeographyLocationValue,
} from '../../../../shared/components/geography-cascade-selector/geography-cascade-selector';
import { ImagePicker } from '../../../../shared/components/image-picker/image-picker';
import { LostPetReportService } from '../../lost-pet-report.service';

const EMPTY_LOCATION: GeographyLocationValue = { departmentId: null, cityId: null, neighborhoodId: null };
const STEP_LABELS = ['Datos', 'Ubicación', 'Imágenes', 'Confirmar'] as const;

@Component({
  selector: 'app-report-create-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, GeographyCascadeSelector, ImagePicker, DecimalPipe],
  template: `
    <div class="mx-auto flex max-w-xl flex-col gap-5 px-4 py-6">
      <h1 class="text-2xl font-semibold text-[var(--color-primary-strong)]">Reportar mascota perdida</h1>

      <ol class="flex justify-between text-xs text-[var(--color-text)]">
        @for (label of stepLabels; track label; let i = $index) {
          <li [class.font-semibold]="i === step()" [class.text-[var(--color-primary-strong)]]="i === step()">
            {{ i + 1 }}. {{ label }}
          </li>
        }
      </ol>

      @if (formError()) {
        <p class="rounded-md bg-[var(--color-alert)] px-3 py-2 text-sm text-[var(--color-on-alert)]">
          {{ formError() }}
        </p>
      }

      <form [formGroup]="form" class="flex flex-col gap-4">
        @if (step() === 0) {
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
        }

        @if (step() === 1) {
          <app-geography-cascade-selector formControlName="location" />

          <button
            type="button"
            (click)="useMyLocation()"
            class="min-h-[44px] rounded-md bg-[var(--color-primary-strong)] px-3 text-sm text-[var(--color-on-primary)]"
          >
            📍 Usar mi ubicación
          </button>

          @if (form.value.latitude && form.value.longitude) {
            <p class="text-xs text-[var(--color-text)]">
              Ubicación capturada ({{ form.value.latitude | number: '1.4-4' }}, {{ form.value.longitude | number: '1.4-4' }})
            </p>
          }
        }

        @if (step() === 2) {
          <app-image-picker [resourceBasePath]="resourceBasePath" formControlName="imageKeys" />
        }

        @if (step() === 3) {
          <div class="flex flex-col gap-1 rounded-lg bg-[var(--color-surface)] p-4 text-sm">
            <p><strong>{{ form.value.petName }}</strong> ({{ form.value.species }})</p>
            <p>{{ form.value.description }}</p>
            <p>{{ form.value.imageKeys?.length ?? 0 }} imagen(es) lista(s).</p>
          </div>
        }
      </form>

      <div class="flex justify-between gap-3">
        @if (step() > 0) {
          <button
            type="button"
            (click)="previousStep()"
            class="min-h-[44px] rounded-md bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)]"
          >
            Atrás
          </button>
        }
        @if (step() < 3) {
          <button
            type="button"
            [disabled]="!canAdvance()"
            (click)="nextStep()"
            class="ml-auto min-h-[44px] rounded-md bg-[var(--color-primary)] px-4 text-[var(--color-on-primary)] disabled:opacity-60"
          >
            Siguiente
          </button>
        } @else {
          <button
            type="button"
            [disabled]="submitting() || !canSubmit()"
            (click)="submit()"
            class="ml-auto min-h-[44px] rounded-md bg-[var(--color-primary-strong)] px-4 text-[var(--color-on-primary)] disabled:opacity-60"
          >
            {{ submitting() ? 'Publicando…' : 'Publicar reporte' }}
          </button>
        }
      </div>
    </div>
  `,
})
export class ReportCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly reportService = inject(LostPetReportService);
  private readonly router = inject(Router);

  protected readonly resourceBasePath = this.reportService.basePath;
  protected readonly stepLabels = STEP_LABELS;
  protected readonly step = signal(0);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    petName: ['', [Validators.required, Validators.maxLength(80)]],
    species: ['DOG'],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    disappearedAt: ['', [Validators.required]],
    location: [EMPTY_LOCATION],
    latitude: this.fb.control<number | null>(null),
    longitude: this.fb.control<number | null>(null),
    imageKeys: this.fb.nonNullable.control<string[]>([]),
  });

  protected useMyLocation(): void {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      this.form.patchValue({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    });
  }

  protected canAdvance(): boolean {
    const value = this.form.getRawValue();
    switch (this.step()) {
      case 0:
        return (
          !!value.petName && value.petName.length <= 80 && !!value.description && value.description.length <= 2000 && !!value.disappearedAt
        );
      case 1:
        return !!value.location.neighborhoodId && value.latitude !== null && value.longitude !== null;
      case 2:
        return value.imageKeys.length >= 1 && value.imageKeys.length <= 5;
      default:
        return true;
    }
  }

  protected canSubmit(): boolean {
    return this.canAdvance() && this.step() === 3;
  }

  protected nextStep(): void {
    if (this.canAdvance()) {
      this.step.update((s) => Math.min(s + 1, 3));
    }
  }

  protected previousStep(): void {
    this.step.update((s) => Math.max(s - 1, 0));
  }

  protected submit(): void {
    this.formError.set(null);
    const value = this.form.getRawValue();

    if (!value.location.neighborhoodId || value.latitude === null || value.longitude === null) {
      return;
    }

    const request: CreateLostPetReportRequest = {
      petName: value.petName,
      species: value.species as CreateLostPetReportRequest['species'],
      description: value.description,
      disappearedAt: new Date(value.disappearedAt).toISOString(),
      latitude: value.latitude,
      longitude: value.longitude,
      neighborhoodId: value.location.neighborhoodId,
      imageKeys: value.imageKeys,
    };

    this.submitting.set(true);
    this.reportService.create(request).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.router.navigate(['/lost-pet-reports', response.id]);
      },
      error: (error: AppApiError) => {
        this.submitting.set(false);
        this.formError.set(error.detail);
      },
    });
  }
}
