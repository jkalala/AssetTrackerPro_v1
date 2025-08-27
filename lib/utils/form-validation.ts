import { z } from 'zod';

// Common validation schemas
export const commonSchemas = {
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  uuid: z.string().uuid('Invalid ID format'),
  url: z.string().url('Please enter a valid URL'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'),
};

// API Key validation
export const apiKeySchema = z.object({
  name: z.string()
    .min(1, 'API key name is required')
    .max(50, 'API key name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'API key name can only contain letters, numbers, spaces, hyphens, and underscores'),
  permissions: z.object({
    assets: z.object({
      read: z.boolean().default(false),
      write: z.boolean().default(false),
    }),
  }).refine(
    (permissions) => permissions.assets.read || permissions.assets.write,
    {
      message: 'At least one permission must be selected',
      path: ['permissions']
    }
  ),
});

// MFA setup validation
export const mfaSetupSchema = z.object({
  verificationCode: z.string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only numbers'),
});

// Session management validation
export const sessionSchema = z.object({
  sessionId: commonSchemas.uuid,
});

// Security event filtering validation
export const securityEventFilterSchema = z.object({
  eventType: z.enum([
    'login_success',
    'login_failure', 
    'mfa_success',
    'mfa_failure',
    'password_change',
    'account_locked',
    'account_unlocked',
    'suspicious_activity',
    'api_key_created',
    'api_key_revoked',
    'session_terminated',
    'concurrent_session_limit'
  ]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: commonSchemas.uuid.optional(),
});

// Form validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  fieldErrors?: Record<string, string>;
}

// Generic form validation function
export function validateForm<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (_error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      const errors: Record<string, string[]> = {};
      
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
        
        // Also create a flat field errors object for easier access
        fieldErrors[path] = err.message;
      });
      
      return {
        success: false,
        errors,
        fieldErrors
      };
    }
    
    return {
      success: false,
      errors: { general: ['Validation failed'] },
      fieldErrors: { general: 'Validation failed' }
    };
  }
}

// Async validation function for server-side validation
export async function validateFormAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  customValidators?: Array<(data: T) => Promise<string | null>>
): Promise<ValidationResult<T>> {
  const result = validateForm(schema, data);
  
  if (!result.success || !result.data) {
    return result;
  }
  
  // Run custom async validators
  if (customValidators && customValidators.length > 0) {
    const customErrors: Record<string, string[]> = {};
    
    for (const validator of customValidators) {
      try {
        const error = await validator(result.data);
        if (error) {
          if (!customErrors.general) {
            customErrors.general = [];
          }
          customErrors.general.push(error);
        }
      } catch (_err) {
        if (!customErrors.general) {
          customErrors.general = [];
        }
        customErrors.general.push('Validation error occurred');
      }
    }
    
    if (Object.keys(customErrors).length > 0) {
      return {
        success: false,
        errors: customErrors,
        fieldErrors: { general: customErrors.general?.[0] || 'Validation failed' }
      };
    }
  }
  
  return result;
}

// Helper function to get first error message for a field
export function getFieldError(
  errors: Record<string, string[]> | undefined,
  fieldName: string
): string | undefined {
  return errors?.[fieldName]?.[0];
}

// Helper function to check if a field has errors
export function hasFieldError(
  errors: Record<string, string[]> | undefined,
  fieldName: string
): boolean {
  return Boolean(errors?.[fieldName]?.length);
}

// Helper function to format validation errors for display
export function formatValidationErrors(
  errors: Record<string, string[]>
): string {
  const allErrors = Object.values(errors).flat();
  return allErrors.join(', ');
}

// Custom validators for specific use cases
export const customValidators = {
  // Check if API key name is unique (would need to be implemented with actual API call)
  uniqueApiKeyName: async (name: string): Promise<string | null> => {
    // This would make an API call to check uniqueness
    // For now, just return null (no error)
    return null;
  },
  
  // Validate TOTP code format
  validTOTPCode: (code: string): string | null => {
    if (!/^\d{6}$/.test(code)) {
      return 'TOTP code must be 6 digits';
    }
    return null;
  },
  
  // Validate session exists
  sessionExists: async (sessionId: string): Promise<string | null> => {
    // This would make an API call to check if session exists
    // For now, just return null (no error)
    return null;
  }
};

// Form state management helper
export interface FormState<T> {
  data: Partial<T>;
  errors: Record<string, string[]>;
  isSubmitting: boolean;
  isValid: boolean;
}

export function createInitialFormState<T>(): FormState<T> {
  return {
    data: {},
    errors: {},
    isSubmitting: false,
    isValid: false
  };
}

export function updateFormState<T>(
  currentState: FormState<T>,
  updates: Partial<FormState<T>>
): FormState<T> {
  return {
    ...currentState,
    ...updates
  };
}