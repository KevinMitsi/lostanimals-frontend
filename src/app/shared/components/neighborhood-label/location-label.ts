import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { GeographicCatalogService } from '../../../features/geography/geographic-catalog.service';

/** Muestra los nombres DIVIPOLA y conserva los códigos como fallback si el catálogo no está disponible. */
@Component({
  selector: 'app-location-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span>📍 {{ neighborhood() }}, {{ municipalityName() }} ({{ departmentName() }})</span>
  `,
})
export class LocationLabel {
  readonly departmentCode = input.required<string>();
  readonly municipalityCode = input.required<string>();
  readonly neighborhood = input.required<string>();

  private readonly catalog = inject(GeographicCatalogService);
  private readonly departments = toSignal(
    this.catalog.getDepartments().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );
  private readonly municipalities = toSignal(
    toObservable(this.departmentCode).pipe(
      switchMap((code) => this.catalog.getMunicipalities(code).pipe(catchError(() => of([])))),
    ),
    { initialValue: [] },
  );

  protected readonly departmentName = computed(
    () =>
      this.departments().find((department) => department.code === this.departmentCode())?.name ??
      `Departamento ${this.departmentCode()}`,
  );
  protected readonly municipalityName = computed(
    () =>
      this.municipalities().find((municipality) => municipality.code === this.municipalityCode())?.name ??
      `Municipio ${this.municipalityCode()}`,
  );
}
