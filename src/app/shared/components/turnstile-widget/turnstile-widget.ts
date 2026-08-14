import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TurnstileLoaderService } from '../../../core/turnstile/turnstile-loader.service';

/**
 * Widget de Cloudflare Turnstile. Cada formulario le pasa su propia `action`
 * (register | login | resend-verification | password-recovery) tal como espera el backend.
 */
@Component({
  selector: 'app-turnstile-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #container></div>`,
})
export class TurnstileWidget {
  readonly siteKey = input.required<string>();
  readonly action = input.required<string>();
  readonly verified = output<string>();
  readonly expired = output<void>();

  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  private readonly loader = inject(TurnstileLoaderService);
  private widgetId: string | null = null;

  constructor() {
    afterNextRender(() => {
      this.loader.load().then(() => this.render());
    });
  }

  /** Fuerza un nuevo desafío tras un 422 BotVerificationFailed. */
  reset(): void {
    if (this.widgetId) {
      window.turnstile?.reset(this.widgetId);
    }
  }

  private render(): void {
    if (!window.turnstile) {
      return;
    }
    this.widgetId = window.turnstile.render(this.container().nativeElement, {
      sitekey: this.siteKey(),
      action: this.action(),
      callback: (token) => this.verified.emit(token),
      'expired-callback': () => this.expired.emit(),
    });
  }
}
