// Password validation utilities

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  if (password.length < 8) {
    return { valid: false, error: "הסיסמה חייבת להכיל לפחות 8 תווים" };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const complexityCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  if (complexityCount < 3) {
    return {
      valid: false,
      error: "הסיסמה חייבת לכלול לפחות 3 מתוך: אותיות גדולות, קטנות, מספרים, תווים מיוחדים",
    };
  }

  return { valid: true };
}

export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 15;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^A-Za-z0-9]/.test(password)) strength += 15;
  
  return Math.min(strength, 100);
}

export function getPasswordStrengthLabel(strength: number): string {
  if (strength < 50) return "חלשה";
  if (strength < 75) return "בינונית";
  return "חזקה";
}

export function getPasswordStrengthColor(strength: number): string {
  if (strength < 50) return "bg-destructive";
  if (strength < 75) return "bg-yellow-500";
  return "bg-green-500";
}
