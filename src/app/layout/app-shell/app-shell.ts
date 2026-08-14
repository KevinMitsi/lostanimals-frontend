import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionStore } from '../../core/auth/session.store';
import { NavIcon, NavIconName } from '../../shared/components/nav-icon/nav-icon';
import { ToastContainer } from '../../shared/components/toast-container/toast-container';

interface NavItem {
  label: string;
  path: string;
  icon: NavIconName;
}

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainer, NavIcon],
  host: {
    class: 'flex min-h-screen flex-col bg-[var(--color-background)] text-[var(--color-text)]',
  },
  template: `
    <app-toast-container />

    <header class="hidden items-center justify-between px-6 py-4 md:flex">
      <span class="text-lg font-semibold text-[var(--color-primary-strong)]">LostAnimals</span>
      <nav class="flex items-center gap-1 rounded-full bg-white px-2 py-1.5 shadow-[0_2px_14px_rgba(47,54,59,0.08)]">
        @for (item of navItems(); track item.path) {
          <a
            [routerLink]="item.path"
            [routerLinkActiveOptions]="{ exact: item.path === '/' }"
            routerLinkActive="is-active"
            class="top-nav-link flex items-center gap-1.5"
          >
            <app-nav-icon [name]="item.icon" class="h-5 w-5" />
            {{ item.label }}
          </a>
        }
      </nav>
    </header>

    <main class="flex-1 pb-[calc(6.5rem+var(--safe-area-bottom))] md:pb-8">
      <router-outlet />
    </main>

    <nav class="floating-nav md:hidden">
      @for (item of navItems(); track item.path) {
        <a
          [routerLink]="item.path"
          [routerLinkActiveOptions]="{ exact: item.path === '/' }"
          routerLinkActive="is-active"
          class="floating-nav-link"
          [attr.aria-label]="item.label"
        >
          <app-nav-icon [name]="item.icon" class="h-8 w-8" />
        </a>
      }
    </nav>
  `,
})
export class AppShell {
  private readonly session = inject(SessionStore);

  protected readonly navItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [
      { label: 'Inicio', path: '/', icon: 'home' },
      { label: 'Reportar', path: '/lost-pet-reports/new', icon: 'megaphone' },
      { label: 'Avistamientos', path: '/sightings', icon: 'eye' },
      { label: 'Mensajes', path: '/conversations', icon: 'paper-airplane' },
      { label: 'Perfil', path: '/profile', icon: 'user' },
    ];

    if (this.session.isModeratorOrAdmin()) {
      items.push({ label: 'Moderación', path: '/moderator', icon: 'shield-check' });
    }
    if (this.session.isAdmin()) {
      items.push({ label: 'Admin', path: '/admin', icon: 'cog' });
    }

    return items;
  });
}
