import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** 12-72 chars, al menos una mayúscula, una minúscula y un número (regla de RegisterUserRequest.password). */
export function passwordComplexityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    return hasUpper && hasLower && hasNumber ? null : { passwordComplexity: true };
  };
}

/** Formato colombiano: +573XXXXXXXXX. */
export function colombianPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }
    return /^\+573\d{9}$/.test(value) ? null : { colombianPhone: true };
  };
}

/** 6-10 dígitos, sin puntos ni espacios. */
export function documentNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null;
    if (!value) {
      return null;
    }
    return /^\d{6,10}$/.test(value) ? null : { documentNumber: true };
  };
}
