import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { REUNION_REVIEW_STATUS_LABELS } from '../../../../core/labels/labels';
import { AppApiError } from '../../../../core/http/problem-detail.util';
import { NotificationService } from '../../../../core/notifications/notification.service';
import { ReunionReviewResponse, ServiceAreaResponse, UserRoleDto } from '../../../../core/models';
import { AdminService } from '../../admin.service';

type Tab = 'areas' | 'roles' | 'reunions';

@Component({
  selector: 'app-admin-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <div class="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <h1 class="text-3xl font-bold tracking-tight text-[var(--color-primary-strong)]">Panel de administración</h1>

      <div class="flex gap-2 rounded-full bg-white p-1 shadow-[0_2px_10px_rgba(47,54,59,0.08)]">
        <button
          type="button"
          (click)="switchTab('areas')"
          class="flex-1 rounded-full py-2 text-xs font-semibold transition-colors sm:text-sm"
          [class]="tab() === 'areas' ? 'bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]' : 'text-[var(--color-text)]'"
        >
          Áreas de servicio
        </button>
        <button
          type="button"
          (click)="switchTab('roles')"
          class="flex-1 rounded-full py-2 text-xs font-semibold transition-colors sm:text-sm"
          [class]="tab() === 'roles' ? 'bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]' : 'text-[var(--color-text)]'"
        >
          Roles
        </button>
        <button
          type="button"
          (click)="switchTab('reunions')"
          class="flex-1 rounded-full py-2 text-xs font-semibold transition-colors sm:text-sm"
          [class]="tab() === 'reunions' ? 'bg-[var(--color-primary-strong)] text-[var(--color-on-primary)]' : 'text-[var(--color-text)]'"
        >
          Reuniones
        </button>
      </div>

      @if (formError()) {
        <p class="banner-alert">{{ formError() }}</p>
      }

      @if (tab() === 'areas') {
        @if (loadingAreas()) {
          <p class="text-center text-sm text-[var(--color-text)]">Cargando…</p>
        } @else if (serviceAreas().length === 0) {
          <p class="text-center text-sm text-[var(--color-text)]">No hay áreas de servicio configuradas.</p>
        }

        <div class="flex flex-col gap-2">
          @for (area of serviceAreas(); track area.cityId) {
            <div class="card-soft flex items-center justify-between gap-2">
              <div class="flex flex-col">
                <span class="font-semibold">{{ area.cityName }}</span>
                <span class="text-xs text-[var(--color-text)] opacity-70">{{ area.departmentName }}</span>
              </div>
              <button
                type="button"
                [disabled]="pendingAreaId() === area.cityId"
                (click)="toggleArea(area)"
                class="btn"
                [class]="area.enabled ? 'btn-secondary' : 'btn-ghost'"
              >
                {{ area.enabled ? 'Activa' : 'Inactiva' }}
              </button>
            </div>
          }
        </div>
      }

      @if (tab() === 'roles') {
        <form [formGroup]="roleForm" (ngSubmit)="submitRoleChange()" class="card flex flex-col gap-3">
          <p class="text-xs text-[var(--color-text)] opacity-70">
            No hay un endpoint para listar usuarios; ingresa el <code>userId</code> directamente.
          </p>
          <label class="field-label">
            ID de usuario
            <input formControlName="userId" class="field-input" placeholder="uuid del usuario" />
          </label>
          <label class="field-label">
            Nuevo rol
            <select formControlName="role" class="field-input">
              <option value="USER">Usuario</option>
              <option value="MODERATOR">Moderador</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>
          <p class="text-xs text-[var(--color-alert-strong)]">
            El usuario deberá volver a iniciar sesión para que el cambio de rol tenga efecto (el rol viaja en su
            token actual).
          </p>
          <button type="submit" [disabled]="roleForm.invalid || changingRole()" class="btn btn-primary self-start">
            {{ changingRole() ? 'Guardando…' : 'Cambiar rol' }}
          </button>
        </form>
      }

      @if (tab() === 'reunions') {
        @if (loadingReunions()) {
          <p class="text-center text-sm text-[var(--color-text)]">Cargando…</p>
        } @else if (reunionReviews().length === 0) {
          <p class="text-center text-sm text-[var(--color-text)]">No hay revisiones de reencuentro pendientes.</p>
        }

        <div class="flex flex-col gap-3">
          @for (review of reunionReviews(); track review.id) {
            <div class="card-soft flex flex-col gap-2">
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold">{{ review.ownerName }}</span>
                <span class="badge bg-white">{{ reunionStatusLabels[review.status] }}</span>
              </div>
              <span class="text-xs text-[var(--color-text)] opacity-70">Tel: {{ review.ownerPhone }}</span>
              <p class="text-sm text-[var(--color-text)]">{{ review.requestNote }}</p>
              <span class="text-xs text-[var(--color-text)] opacity-70">{{ review.createdAt | date: 'medium' }}</span>

              @if (review.status === 'PENDING') {
                <div class="flex gap-2">
                  <button type="button" (click)="openDecision(review.id, true)" class="btn btn-primary">Aprobar</button>
                  <button type="button" (click)="openDecision(review.id, false)" class="btn btn-alert">Rechazar</button>
                </div>

                @if (decisionOpenId() === review.id) {
                  <form [formGroup]="decisionForm" (ngSubmit)="submitDecision(review)" class="card flex flex-col gap-2">
                    <label class="field-label">
                      Nota para el dueño ({{ decisionApproved() ? 'aprobación' : 'rechazo' }})
                      <textarea formControlName="note" rows="2" class="field-textarea"></textarea>
                    </label>
                    <div class="flex gap-2">
                      <button type="submit" [disabled]="decisionForm.invalid" class="btn btn-primary">Confirmar</button>
                      <button type="button" (click)="decisionOpenId.set(null)" class="btn btn-ghost">Cancelar</button>
                    </div>
                  </form>
                }
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminPage {
  private readonly adminService = inject(AdminService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly reunionStatusLabels = REUNION_REVIEW_STATUS_LABELS;

  protected readonly tab = signal<Tab>('areas');
  protected readonly formError = signal<string | null>(null);

  protected readonly serviceAreas = signal<ServiceAreaResponse[]>([]);
  protected readonly loadingAreas = signal(true);
  protected readonly pendingAreaId = signal<string | null>(null);

  protected readonly changingRole = signal(false);
  protected readonly roleForm = this.fb.nonNullable.group({
    userId: ['', [Validators.required]],
    role: ['USER' as UserRoleDto, [Validators.required]],
  });

  protected readonly reunionReviews = signal<ReunionReviewResponse[]>([]);
  protected readonly loadingReunions = signal(false);
  protected readonly decisionOpenId = signal<string | null>(null);
  protected readonly decisionApproved = signal(true);
  protected readonly decisionForm = this.fb.nonNullable.group({
    note: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  constructor() {
    this.fetchAreas();
  }

  protected switchTab(tab: Tab): void {
    this.tab.set(tab);
    if (tab === 'reunions' && this.reunionReviews().length === 0) {
      this.fetchReunions();
    }
  }

  protected toggleArea(area: ServiceAreaResponse): void {
    this.formError.set(null);
    this.pendingAreaId.set(area.cityId);

    this.adminService.setServiceArea(area.cityId, !area.enabled).subscribe({
      next: () => {
        this.pendingAreaId.set(null);
        this.serviceAreas.update((list) =>
          list.map((a) => (a.cityId === area.cityId ? { ...a, enabled: !area.enabled } : a)),
        );
      },
      error: (error: AppApiError) => {
        this.pendingAreaId.set(null);
        this.formError.set(error.detail);
      },
    });
  }

  protected submitRoleChange(): void {
    if (this.roleForm.invalid) {
      return;
    }
    this.formError.set(null);
    this.changingRole.set(true);
    const { userId, role } = this.roleForm.getRawValue();

    this.adminService.changeUserRole(userId, role).subscribe({
      next: () => {
        this.changingRole.set(false);
        this.roleForm.reset({ userId: '', role: 'USER' });
        this.notifications.success('Rol actualizado. El usuario debe volver a iniciar sesión.');
      },
      error: (error: AppApiError) => {
        this.changingRole.set(false);
        this.formError.set(error.detail);
      },
    });
  }

  protected openDecision(reviewId: string, approved: boolean): void {
    this.decisionForm.reset({ note: '' });
    this.decisionApproved.set(approved);
    this.decisionOpenId.set(reviewId);
  }

  protected submitDecision(review: ReunionReviewResponse): void {
    if (this.decisionForm.invalid) {
      return;
    }
    this.formError.set(null);
    const approved = this.decisionApproved();

    this.adminService.decideReunionReview(review.id, { approved, note: this.decisionForm.getRawValue().note }).subscribe({
      next: () => {
        this.decisionOpenId.set(null);
        this.reunionReviews.update((list) =>
          list.map((r) => (r.id === review.id ? { ...r, status: approved ? 'APPROVED' : 'REJECTED' } : r)),
        );
      },
      error: (error: AppApiError) => this.formError.set(error.detail),
    });
  }

  private fetchAreas(): void {
    this.loadingAreas.set(true);
    this.adminService.getServiceAreas().subscribe({
      next: (areas) => {
        this.loadingAreas.set(false);
        this.serviceAreas.set(areas);
      },
      error: () => this.loadingAreas.set(false),
    });
  }

  private fetchReunions(): void {
    this.loadingReunions.set(true);
    this.adminService.getReunionReviews().subscribe({
      next: (reviews) => {
        this.loadingReunions.set(false);
        this.reunionReviews.set(reviews);
      },
      error: () => this.loadingReunions.set(false),
    });
  }
}
