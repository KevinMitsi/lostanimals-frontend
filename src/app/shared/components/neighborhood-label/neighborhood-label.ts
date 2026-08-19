import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { GeographicCatalogService } from '../../../features/geography/geographic-catalog.service';

/** Resuelve un neighborhoodId contra el backend y lo muestra como "Barrio, Ciudad (Departamento)". */
@Component({
  selector: 'app-neighborhood-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (detail(); as detail) {
      <span>📍 {{ detail.neighborhoodName }}, {{ detail.cityName }} ({{ detail.departmentName }})</span>
    }
  `,
})
export class NeighborhoodLabel {
  readonly neighborhoodId = input.required<string>();

  private readonly catalog = inject(GeographicCatalogService);

  protected readonly detail = toSignal(
    toObservable(this.neighborhoodId).pipe(switchMap((id) => this.catalog.getNeighborhoodDetail(id))),
  );
}
