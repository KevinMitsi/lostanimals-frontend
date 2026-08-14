import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { ToastContainer } from '../../shared/components/toast-container/toast-container';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainer],
  host: {
    class: 'flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-text)]',
  },
  template: `
    <app-toast-container />

    <header
      class="hidden items-center justify-between border-b border-[var(--color-surface)] px-6 py-3 md:flex"
      [style.padding-top.px]="0"
    >
      <span class="text-lg font-semibold text-[var(--color-primary-strong)]">LostAnimals</span>
      <nav class="flex items-center gap-6">
        @for (item of navItems(); track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="text-[var(--color-primary-strong)] font-semibold"
            class="text-sm text-[var(--color-text)] hover:text-[var(--color-primary)]"
          >
            {{ item.label }}
          </a>
        }
      </nav>
    </header>

    <main class="flex-1 pb-[calc(4.5rem+var(--safe-area-bottom))] md:pb-0">
      <router-outlet />
    </main>

    <nav
      class="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-[var(--color-surface)] bg-[var(--color-background)] md:hidden"
      style="padding-bottom: max(0.5rem, var(--safe-area-bottom)); padding-left: var(--safe-area-left); padding-right: var(--safe-area-right);"
    >
      @for (item of navItems(); track item.path) {
        <a
          [routerLink]="item.path"
          routerLinkActive="text-[var(--color-primary-strong)]"
          class="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] text-[var(--color-text)]"
        >
          <span aria-hidden="true" class="text-lg leading-none">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
})
export class AppShell {
  private readonly session = inject(SessionStore);

  protected readonly navItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [
      { label: 'Inicio', path: '/', icon: '🏠' },
      { label: 'Reportar', path: '/lost-pet-reports/new', icon: '📢' },
      { label: 'Avistamientos', path: '/sightings', icon: '👁' },
      { label: 'Mensajes', path: '/conversations', icon: '💬' },
      { label: 'Perfil', path: '/profile', icon: '👤' },
    ];

    if (this.session.isModeratorOrAdmin()) {
      items.push({ label: 'Moderación', path: '/moderator', icon: '🛡' });
    }
    if (this.session.isAdmin()) {
      items.push({ label: 'Admin', path: '/admin', icon: '⚙' });
    }

    return items;
  });
}
