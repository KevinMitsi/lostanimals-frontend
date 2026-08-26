import { ChangeDetectionStrategy, Component, forwardRef, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { catchError, finalize, of, switchMap, tap } from 'rxjs';
import { GeographicCatalogService } from '../../../features/geography/geographic-catalog.service';

export interface GeographyLocationValue {
  departmentCode: string | null;
  municipalityCode: string | null;
  neighborhood: string;
}

/** Selector DIVIPOLA departamento → municipio, con barrio como texto libre opcional. */
@Component({
  selector: 'app-geography-cascade-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GeographyCascadeSelector),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-3 sm:flex-row sm:gap-4">
      <label class="field-label flex-1">
        Departamento
        <select
          class="field-input"
          [disabled]="disabled() || departmentsLoading()"
          (change)="onDepartmentChange($any($event.target).value)"
        >
          <option value="" [selected]="!departmentCode()">
            {{ departmentsLoading() ? 'Cargando…' : 'Selecciona…' }}
          </option>
          @for (department of departments(); track department.code) {
            <option [value]="department.code" [selected]="department.code === departmentCode()">
              {{ department.name }}
            </option>
          }
        </select>
      </label>

      <label class="field-label flex-1">
        Municipio
        <select
          class="field-input"
          [disabled]="disabled() || !departmentCode() || municipalitiesLoading()"
          (change)="onMunicipalityChange($any($event.target).value)"
        >
          <option value="" [selected]="!municipalityCode()">
            {{ municipalitiesLoading() ? 'Cargando…' : 'Selecciona…' }}
          </option>
          @for (municipality of municipalities(); track municipality.code) {
            <option [value]="municipality.code" [selected]="municipality.code === municipalityCode()">
              {{ municipality.name }}
            </option>
          }
        </select>
      </label>

      @if (showNeighborhood()) {
        <label class="field-label flex-1">
          Barrio
          <input
            type="text"
            class="field-input"
            maxlength="120"
            autocomplete="address-level3"
            placeholder="Escribe el barrio"
            [disabled]="disabled() || !municipalityCode()"
            [value]="neighborhood()"
            (input)="onNeighborhoodChange($any($event.target).value)"
          />
        </label>
      }
    </div>

    @if (catalogError()) {
      <p class="mt-2 text-xs text-[var(--color-alert-strong)]">{{ catalogError() }}</p>
    }
  `,
})
export class GeographyCascadeSelector implements ControlValueAccessor {
  readonly showNeighborhood = input(true);

  private readonly catalog = inject(GeographicCatalogService);

  protected readonly departmentCode = signal<string | null>(null);
  protected readonly municipalityCode = signal<string | null>(null);
  protected readonly neighborhood = signal('');
  protected readonly disabled = signal(false);
  protected readonly departmentsLoading = signal(true);
  protected readonly municipalitiesLoading = signal(false);
  protected readonly catalogError = signal<string | null>(null);

  protected readonly departments = toSignal(
    this.catalog.getDepartments().pipe(
      tap(() => {
        this.departmentsLoading.set(false);
        this.catalogError.set(null);
      }),
      catchError(() => {
        this.departmentsLoading.set(false);
        this.catalogError.set('No se pudieron cargar los departamentos. Intenta nuevamente.');
        return of([]);
      }),
    ),
    { initialValue: [] },
  );

  protected readonly municipalities = toSignal(
    toObservable(this.departmentCode).pipe(
      switchMap((code) => {
        if (!code) {
          this.municipalitiesLoading.set(false);
          return of([]);
        }
        this.municipalitiesLoading.set(true);
        this.catalogError.set(null);
        return this.catalog.getMunicipalities(code).pipe(
          catchError(() => {
            this.catalogError.set('No se pudieron cargar los municipios. Intenta nuevamente.');
            return of([]);
          }),
          finalize(() => this.municipalitiesLoading.set(false)),
        );
      }),
    ),
    { initialValue: [] },
  );

  private onChange: (value: GeographyLocationValue) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: GeographyLocationValue | null): void {
    this.departmentCode.set(value?.departmentCode ?? null);
    this.municipalityCode.set(value?.municipalityCode ?? null);
    this.neighborhood.set(value?.neighborhood ?? '');
  }

  registerOnChange(fn: (value: GeographyLocationValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onDepartmentChange(code: string): void {
    this.departmentCode.set(code || null);
    this.municipalityCode.set(null);
    this.neighborhood.set('');
    this.emit();
  }

  protected onMunicipalityChange(code: string): void {
    this.municipalityCode.set(code || null);
    this.neighborhood.set('');
    this.emit();
  }

  protected onNeighborhoodChange(neighborhood: string): void {
    this.neighborhood.set(neighborhood);
    this.emit();
  }

  private emit(): void {
    this.onTouched();
    this.onChange({
      departmentCode: this.departmentCode(),
      municipalityCode: this.municipalityCode(),
      neighborhood: this.showNeighborhood() ? this.neighborhood() : '',
    });
  }
}
