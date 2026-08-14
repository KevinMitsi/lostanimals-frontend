import { ChangeDetectionStrategy, Component, forwardRef, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { of, switchMap } from 'rxjs';
import { GeographicCatalogService } from '../../../features/geography/geographic-catalog.service';

export interface GeographyLocationValue {
  departmentId: string | null;
  cityId: string | null;
  neighborhoodId: string | null;
}

/**
 * Selector en cascada departamento → ciudad → barrio, reutilizable como `formControlName`
 * en formularios de creación (reportes/avistamientos) y como filtro de búsqueda.
 * Con `[showNeighborhood]="false"` queda en departamento → ciudad, para el panel de admin
 * (áreas de servicio, que opera a nivel de ciudad).
 *
 * Nota: al no existir en el backend un endpoint para resolver el departamento/ciudad
 * a partir de un neighborhoodId, si se hace `writeValue` con solo `neighborhoodId` los
 * selects de departamento/ciudad no se pueden preseleccionar automáticamente.
 */
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
          [value]="departmentId() ?? ''"
          [disabled]="disabled()"
          (change)="onDepartmentChange($any($event.target).value)"
        >
          <option value="">Selecciona…</option>
          @for (department of departments(); track department.id) {
            <option [value]="department.id">{{ department.name }}</option>
          }
        </select>
      </label>

      <label class="field-label flex-1">
        Ciudad
        <select
          class="field-select"
          [value]="cityId() ?? ''"
          [disabled]="disabled() || !departmentId()"
          (change)="onCityChange($any($event.target).value)"
        >
          <option value="">Selecciona…</option>
          @for (city of cities(); track city.id) {
            <option [value]="city.id">{{ city.name }}</option>
          }
        </select>
      </label>

      @if (showNeighborhood()) {
        <label class="field-label flex-1">
          Barrio
          <select
            class="field-select"
            [value]="neighborhoodId() ?? ''"
            [disabled]="disabled() || !cityId()"
            (change)="onNeighborhoodChange($any($event.target).value)"
          >
            <option value="">Selecciona…</option>
            @for (neighborhood of neighborhoods(); track neighborhood.id) {
              <option [value]="neighborhood.id">{{ neighborhood.name }}</option>
            }
          </select>
        </label>
      }
    </div>
  `,
})
export class GeographyCascadeSelector implements ControlValueAccessor {
  readonly showNeighborhood = input(true);

  private readonly catalog = inject(GeographicCatalogService);

  protected readonly departmentId = signal<string | null>(null);
  protected readonly cityId = signal<string | null>(null);
  protected readonly neighborhoodId = signal<string | null>(null);
  protected readonly disabled = signal(false);

  protected readonly departments = toSignal(this.catalog.getDepartments(), { initialValue: [] });

  protected readonly cities = toSignal(
    toObservable(this.departmentId).pipe(switchMap((id) => (id ? this.catalog.getCities(id) : of([])))),
    { initialValue: [] },
  );

  protected readonly neighborhoods = toSignal(
    toObservable(this.cityId).pipe(switchMap((id) => (id ? this.catalog.getNeighborhoods(id) : of([])))),
    { initialValue: [] },
  );

  private onChange: (value: GeographyLocationValue) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: GeographyLocationValue | null): void {
    this.departmentId.set(value?.departmentId ?? null);
    this.cityId.set(value?.cityId ?? null);
    this.neighborhoodId.set(value?.neighborhoodId ?? null);
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

  protected onDepartmentChange(id: string): void {
    this.departmentId.set(id || null);
    this.cityId.set(null);
    this.neighborhoodId.set(null);
    this.emit();
  }

  protected onCityChange(id: string): void {
    this.cityId.set(id || null);
    this.neighborhoodId.set(null);
    this.emit();
  }

  protected onNeighborhoodChange(id: string): void {
    this.neighborhoodId.set(id || null);
    this.emit();
  }

  private emit(): void {
    this.onTouched();
    this.onChange({
      departmentId: this.departmentId(),
      cityId: this.cityId(),
      neighborhoodId: this.showNeighborhood() ? this.neighborhoodId() : null,
    });
  }
}
