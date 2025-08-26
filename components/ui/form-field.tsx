'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  children: React.ReactNode;
  error?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

export function FormField({ 
  children, 
  error, 
  success, 
  hint, 
  required, 
  className 
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
      
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && !error && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      
      {hint && !error && !success && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 flex-shrink-0" />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children: React.ReactNode;
}

export function FormLabel({ required, children, className, ...props }: FormLabelProps) {
  return (
    <label 
      className={cn(
        'block text-sm font-medium text-foreground',
        className
      )} 
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  success?: boolean;
}

export function FormInput({ error, success, className, ...props }: FormInputProps) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 border rounded-md text-sm',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        {
          'border-destructive focus:ring-destructive': error,
          'border-green-500 focus:ring-green-500': success && !error,
          'border-input focus:ring-ring': !error && !success,
        },
        className
      )}
      {...props}
    />
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  success?: boolean;
}

export function FormTextarea({ error, success, className, ...props }: FormTextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full px-3 py-2 border rounded-md text-sm',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        'resize-vertical min-h-[80px]',
        {
          'border-destructive focus:ring-destructive': error,
          'border-green-500 focus:ring-green-500': success && !error,
          'border-input focus:ring-ring': !error && !success,
        },
        className
      )}
      {...props}
    />
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  success?: boolean;
  children: React.ReactNode;
}

export function FormSelect({ error, success, className, children, ...props }: FormSelectProps) {
  return (
    <select
      className={cn(
        'w-full px-3 py-2 border rounded-md text-sm',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        'bg-background',
        {
          'border-destructive focus:ring-destructive': error,
          'border-green-500 focus:ring-green-500': success && !error,
          'border-input focus:ring-ring': !error && !success,
        },
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  success?: boolean;
}

export function FormCheckbox({ label, error, success, className, ...props }: FormCheckboxProps) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded border-input',
          'focus:ring-2 focus:ring-offset-2 focus:ring-ring',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'border-destructive focus:ring-destructive': error,
            'border-green-500 focus:ring-green-500': success && !error,
          },
          className
        )}
        {...props}
      />
      <span className={cn(
        'text-sm',
        {
          'text-destructive': error,
          'text-green-600': success && !error,
          'text-foreground': !error && !success,
        }
      )}>
        {label}
      </span>
    </label>
  );
}

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FormGroup({ children, className }: FormGroupProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function FormActions({ children, className }: FormActionsProps) {
  return (
    <div className={cn(
      'flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t',
      className
    )}>
      {children}
    </div>
  );
}

// Validation status indicator
interface ValidationStatusProps {
  status: 'idle' | 'validating' | 'valid' | 'invalid';
  message?: string;
}

export function ValidationStatus({ status, message }: ValidationStatusProps) {
  if (status === 'idle') return null;

  const config = {
    validating: {
      icon: <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full" />,
      className: 'text-muted-foreground',
      defaultMessage: 'Validating...'
    },
    valid: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      className: 'text-green-600',
      defaultMessage: 'Valid'
    },
    invalid: {
      icon: <AlertCircle className="h-4 w-4" />,
      className: 'text-destructive',
      defaultMessage: 'Invalid'
    }
  };

  const { icon, className, defaultMessage } = config[status];

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {icon}
      <span>{message || defaultMessage}</span>
    </div>
  );
}

// Password strength indicator
interface PasswordStrengthProps {
  password: string;
  requirements?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  };
}

export function PasswordStrength({ 
  password, 
  requirements = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  }
}: PasswordStrengthProps) {
  const checks = [
    {
      label: `At least ${requirements.minLength} characters`,
      valid: password.length >= (requirements.minLength || 8),
      required: true
    },
    {
      label: 'Uppercase letter',
      valid: /[A-Z]/.test(password),
      required: requirements.requireUppercase
    },
    {
      label: 'Lowercase letter',
      valid: /[a-z]/.test(password),
      required: requirements.requireLowercase
    },
    {
      label: 'Number',
      valid: /\d/.test(password),
      required: requirements.requireNumbers
    },
    {
      label: 'Special character',
      valid: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      required: requirements.requireSpecialChars
    }
  ].filter(check => check.required);

  const validChecks = checks.filter(check => check.valid).length;
  const strength = validChecks / checks.length;

  const getStrengthColor = () => {
    if (strength < 0.5) return 'bg-red-500';
    if (strength < 0.8) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (strength < 0.5) return 'Weak';
    if (strength < 0.8) return 'Medium';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Password strength:</span>
        <span className={cn(
          'text-sm font-medium',
          {
            'text-red-600': strength < 0.5,
            'text-yellow-600': strength >= 0.5 && strength < 0.8,
            'text-green-600': strength >= 0.8
          }
        )}>
          {getStrengthLabel()}
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={cn('h-2 rounded-full transition-all duration-300', getStrengthColor())}
          style={{ width: `${strength * 100}%` }}
        />
      </div>
      
      <div className="space-y-1">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {check.valid ? (
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            ) : (
              <div className="h-3 w-3 rounded-full border border-muted-foreground" />
            )}
            <span className={check.valid ? 'text-green-600' : 'text-muted-foreground'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}