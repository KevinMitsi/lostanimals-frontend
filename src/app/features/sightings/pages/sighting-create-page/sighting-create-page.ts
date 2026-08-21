import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { CreateSightingRequest, DuplicateSightingWarningResponse } from '../../../../core/models';
import {
  GeographyCascadeSelector,
  GeographyLocationValue,
} from '../../../../shared/components/geography-cascade-selector/geography-cascade-selector';
import { ImagePicker } from '../../../../shared/components/image-picker/image-picker';
import { SightingMap } from '../../../../shared/components/sighting-map/sighting-map';
import { GeoCoordinates, GeolocationService } from '../../../../core/location/geolocation.service';
import { notInFutureValidator, nowAsDatetimeLocal } from '../../../../core/validators/validators';
import { SightingService } from '../../sighting.service';

const EMPTY_LOCATION: GeographyLocationValue = { departmentId: null, cityId: null, neighborhoodId: null };
const STEP_LABELS = ['Datos', 'Ubicación', 'Imágenes', 'Confirmar'] as const;

@Component({
  selector: 'app-sighting-create-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, GeographyCascadeSelector, ImagePicker, SightingMap, DecimalPipe, DatePipe],
  template: `
    <div class="mx-auto flex max-w-xl flex-col gap-5 px-4 py-6">
      <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Reportar avistamiento</h1>

      <ol class="flex items-start">
        @for (label of stepLabels; track label; let i = $index; let last = $last) {
          <li class="flex flex-1 flex-col gap-1.5">
            <div class="flex items-center">
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors"
                [class]="i <= step() ? 'bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]' : 'bg-white text-[var(--color-text)] opacity-60 shadow-[0_1px_4px_rgba(47,54,59,0.08)]'"
              >
                {{ i + 1 }}
              </span>
              @if (!last) {
                <span
                  class="h-0.5 flex-1 transition-colors"
                  [class]="i < step() ? 'bg-[var(--color-primary-strong)]' : 'bg-[var(--color-surface)]'"
                ></span>
              }
            </div>
            <span
              class="block text-[11px] font-medium"
              [class]="i <= step() ? 'text-[var(--color-primary-strong)]' : 'text-[var(--color-text)] opacity-60'"
            >
              {{ label }}
            </span>
          </li>
        }
      </ol>

      @if (formError()) {
        <p class="banner-alert">{{ formError() }}</p>
      }

      @if (duplicateWarning(); as warning) {
        <div class="card flex flex-col gap-3 border-2 border-[var(--color-alert)]">
          <p class="text-sm font-semibold text-[var(--color-alert-strong)]">
            Ya existe un avistamiento parecido cerca
          </p>
          <p class="text-sm text-[var(--color-text)]">
            A {{ warning.distanceMeters | number: '1.0-0' }} metros, visto el
            {{ warning.observedAt | date: 'medium' }}. ¿Es un avistamiento distinto?
          </p>
          <div class="flex flex-wrap gap-2">
            <button type="button" [disabled]="submitting()" (click)="confirmDuplicate()" class="btn btn-primary">
              {{ submitting() ? 'Publicando…' : 'Sí, es otro avistamiento' }}
            </button>
            <button type="button" (click)="duplicateWarning.set(null)" class="btn btn-ghost">
              Cancelar, quiero revisar
            </button>
          </div>
        </div>
      } @else {
        <form [formGroup]="form" class="card flex flex-col gap-4">
          @if (step() === 0) {
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
              <input type="datetime-local" formControlName="observedAt" [max]="maxDateTime" class="field-input" />
              @if (form.controls.observedAt.errors?.['futureDate']) {
                <span class="text-xs text-[var(--color-alert-strong)]">
                  La fecha no puede ser en el futuro.
                </span>
              }
            </label>
          }

          @if (step() === 1) {
            <app-geography-cascade-selector formControlName="location" />

            @if (location.errorMessage()) {
              <p class="text-sm text-[var(--color-alert-strong)]">{{ location.errorMessage() }}</p>
            }

            <app-sighting-map
              [center]="location.position()"
              [selectable]="true"
              [selectedPoint]="selectedPoint()"
              ariaLabel="Mapa para elegir la ubicación exacta del avistamiento"
              (pointSelected)="selectPoint($event)"
            />

            <button type="button" (click)="useMyLocation()" class="btn btn-primary">📍 Usar mi ubicación</button>

            @if (latitude() !== null && longitude() !== null) {
              <p class="text-xs text-[var(--color-text)]">
                Ubicación capturada ({{ latitude() | number: '1.4-4' }},
                {{ longitude() | number: '1.4-4' }})
              </p>
            }
          }

          @if (step() === 2) {
            <app-image-picker [resourceBasePath]="resourceBasePath" formControlName="imageKeys" />
          }

          @if (step() === 3) {
            <div class="card-soft flex flex-col gap-1">
              <p><strong>{{ form.value.species }}</strong></p>
              <p>{{ form.value.description }}</p>
              <p>{{ form.value.imageKeys?.length ?? 0 }} imagen(es) lista(s).</p>
            </div>
          }
        </form>

        <div class="flex justify-between gap-3">
          @if (step() > 0) {
            <button type="button" (click)="previousStep()" class="btn btn-ghost">Atrás</button>
          }
          @if (step() < 3) {
            <button type="button" [disabled]="!canAdvance()" (click)="nextStep()" class="btn btn-accent ml-auto">
              Siguiente
            </button>
          } @else {
            <button
              type="button"
              [disabled]="submitting() || !canSubmit()"
              (click)="submit()"
              class="btn btn-primary ml-auto"
            >
              {{ submitting() ? 'Publicando…' : 'Publicar avistamiento' }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class SightingCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly sightingService = inject(SightingService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly location = inject(GeolocationService);

  protected readonly resourceBasePath = this.sightingService.basePath;
  protected readonly stepLabels = STEP_LABELS;
  protected readonly step = signal(0);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly duplicateWarning = signal<DuplicateSightingWarningResponse | null>(null);

  /**
   * Signals, no FormControls: el callback de getCurrentPosition corre fuera del ciclo
   * normal de eventos de plantilla, y con OnPush un patchValue() ahí no siempre repinta
   * (depende de que zone.js parchee la API). Las signals sí notifican el repintado siempre.
   */
  protected readonly latitude = signal<number | null>(null);
  protected readonly longitude = signal<number | null>(null);
  protected readonly selectedPoint = signal<GeoCoordinates | null>(null);
  protected readonly maxDateTime = nowAsDatetimeLocal();

  protected readonly form = this.fb.nonNullable.group({
    species: ['DOG'],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
    observedAt: ['', [Validators.required, notInFutureValidator()]],
    location: [EMPTY_LOCATION],
    imageKeys: this.fb.nonNullable.control<string[]>([]),
  });

  constructor() {
    effect(() => {
      const position = this.location.position();
      if (position && this.selectedPoint() === null) this.selectPoint(position);
    });
    this.destroyRef.onDestroy(() => this.location.stopWatching());
  }

  protected useMyLocation(): void {
    const position = this.location.position();
    if (position) this.selectPoint(position);
    this.location.startWatching();
  }

  protected selectPoint(point: GeoCoordinates): void {
    this.selectedPoint.set(point);
    this.latitude.set(point.latitude);
    this.longitude.set(point.longitude);
  }

  protected canAdvance(): boolean {
    const value = this.form.getRawValue();
    switch (this.step()) {
      case 0:
        return (
          !!value.description &&
          value.description.length <= 2000 &&
          !!value.observedAt &&
          new Date(value.observedAt).getTime() <= Date.now()
        );
      case 1:
        return !!value.location.neighborhoodId && this.latitude() !== null && this.longitude() !== null;
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
      if (this.step() === 1) this.location.startWatching();
    }
  }

  protected previousStep(): void {
    this.step.update((s) => Math.max(s - 1, 0));
  }

  protected submit(): void {
    this.doSubmit(false);
  }

  protected confirmDuplicate(): void {
    this.doSubmit(true);
  }

  private doSubmit(confirmPossibleDuplicate: boolean): void {
    this.formError.set(null);
    const value = this.form.getRawValue();
    const latitude = this.latitude();
    const longitude = this.longitude();

    if (!value.location.neighborhoodId || latitude === null || longitude === null) {
      return;
    }

    const request: CreateSightingRequest = {
      species: value.species as CreateSightingRequest['species'],
      description: value.description,
      observedAt: new Date(value.observedAt).toISOString(),
      latitude,
      longitude,
      neighborhoodId: value.location.neighborhoodId,
      imageKeys: value.imageKeys,
      confirmPossibleDuplicate,
    };

    this.submitting.set(true);
    this.sightingService.create(request).subscribe({
      next: (response) => {
        this.submitting.set(false);
        if (response.created) {
          this.router.navigate(['/sightings', response.id]);
        } else if (response.warning) {
          this.duplicateWarning.set(response.warning);
        }
      },
      error: (error: AppApiError) => {
        this.submitting.set(false);
        this.formError.set(error.detail);
      },
    });
  }
}
