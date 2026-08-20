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
import { environment } from '../../../../environments/environment';
import { GoogleIdentityLoaderService } from '../../../core/google/google-identity-loader.service';

/**
 * Botón oficial "Sign in with Google". `text` cambia el copy nativo del botón
 * ("signup_with" en registro, "signin_with" en login); cada página decide qué
 * hacer con el credential emitido (crear cuenta o iniciar sesión son la misma
 * llamada al backend, `POST /auth/google`).
 */
@Component({
  selector: 'app-google-sign-in-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #container></div>`,
})
export class GoogleSignInButton {
  readonly text = input<'signin_with' | 'signup_with'>('signin_with');
  readonly credential = output<string>();

  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  private readonly loader = inject(GoogleIdentityLoaderService);

  constructor() {
    afterNextRender(() => {
      this.loader.load().then(() => this.render());
    });
  }

  private render(): void {
    if (!window.google) {
      return;
    }
    window.google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response) => this.credential.emit(response.credential),
    });
    window.google.accounts.id.renderButton(this.container().nativeElement, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: this.text(),
    });
  }
}
