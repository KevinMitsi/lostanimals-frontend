import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  Output,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { environment } from '../../../../environments/environment';
import { GoogleIdentityService } from '../../../core/auth/google-identity.service';

@Component({
  selector: 'app-google-auth-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #host
      class="flex min-h-11 justify-center"
      [class.pointer-events-none]="disabled"
      [class.opacity-50]="disabled"
      [attr.aria-disabled]="disabled"
    ></div>
    @if (loadError()) {
      <p class="mt-2 text-center text-xs text-[var(--color-alert-strong)]">
        No fue posible cargar el acceso con Google. Intenta nuevamente.
      </p>
    }
  `,
})
export class GoogleAuthButton implements AfterViewInit {
  private readonly googleIdentity = inject(GoogleIdentityService);
  private readonly zone = inject(NgZone);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');

  @Input() disabled = false;
  @Input() text: 'continue_with' | 'signup_with' | 'signin_with' = 'continue_with';
  @Output() readonly credentialReceived = new EventEmitter<string>();
  protected readonly loadError = signal(false);

  ngAfterViewInit(): void {
    this.googleIdentity.load().then((google) => {
      google.initialize({
        client_id: environment.googleClientId,
        callback: (response) => this.zone.run(() => this.credentialReceived.emit(response.credential)),
      });
      google.renderButton(this.host().nativeElement, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: this.text,
        shape: 'rectangular',
        width: 320,
        locale: 'es',
      });
    }).catch(() => this.zone.run(() => this.loadError.set(true)));
  }
}
