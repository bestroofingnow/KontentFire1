import { z } from 'zod';
import { useState, useEffect } from 'react';

/**
 * Creates a simplified validation error message from Zod errors
 * 
 * @param errors The errors from Zod validation
 * @returns A map of field names to error messages
 * 
 * @example
 * const schema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8)
 * });
 * 
 * try {
 *   schema.parse({ email: 'invalid', password: '123' });
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     const fieldErrors = formatZodErrors(error);
 *     console.log(fieldErrors);
 *     // { email: 'Invalid email', password: 'String must contain at least 8 character(s)' }
 *   }
 * }
 */
export function formatZodErrors(errors: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  for (const error of errors.errors) {
    const field = error.path.join('.');
    formattedErrors[field] = error.message;
  }
  
  return formattedErrors;
}

/**
 * A utility to create a controlled form field with validation
 * 
 * @param initialValue The initial value of the field
 * @param validator A Zod schema for validation
 * @returns An object with value, error, onChange, and onBlur
 * 
 * @example
 * const emailField = useFormField('', z.string().email());
 * 
 * return (
 *   <div>
 *     <input
 *       value={emailField.value}
 *       onChange={emailField.onChange}
 *       onBlur={emailField.onBlur}
 *     />
 *     {emailField.error && <span className="error">{emailField.error}</span>}
 *   </div>
 * );
 */
export function useFormField<T>(initialValue: T, validator?: z.ZodType<T>) {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  
  // Validate the field when the value changes and the field has been touched
  useEffect(() => {
    if (touched && validator) {
      try {
        validator.parse(value);
        setError(null);
      } catch (error) {
        if (error instanceof z.ZodError) {
          setError(error.errors[0].message);
        }
      }
    }
  }, [value, touched, validator]);
  
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // Type cast is necessary for handling both string inputs and custom types like numbers
    setValue(e.target.value as unknown as T);
  };
  
  const onBlur = () => {
    setTouched(true);
  };
  
  return { value, error, onChange, onBlur, setValue, setError };
}

/**
 * A utility that combines multiple form fields into one form
 * 
 * @param fieldsConfig An object where keys are field names and values are useFormField returns
 * @returns An object with values, errors, and isValid
 * 
 * @example
 * const emailField = useFormField('', z.string().email());
 * const passwordField = useFormField('', z.string().min(8));
 * 
 * const form = useForm({
 *   email: emailField,
 *   password: passwordField,
 * });
 * 
 * const handleSubmit = (e) => {
 *   e.preventDefault();
 *   if (form.isValid) {
 *     console.log(form.values);
 *   }
 * };
 */
export function useForm<T extends Record<string, ReturnType<typeof useFormField<any>>>>(fieldsConfig: T) {
  // Extract values and errors from all fields
  const values = Object.entries(fieldsConfig).reduce((acc, [key, field]) => {
    acc[key] = field.value;
    return acc;
  }, {} as Record<string, any>);
  
  const errors = Object.entries(fieldsConfig).reduce((acc, [key, field]) => {
    if (field.error) {
      acc[key] = field.error;
    }
    return acc;
  }, {} as Record<string, string>);
  
  // Form is valid if there are no errors
  const isValid = Object.keys(errors).length === 0;
  
  return { values, errors, isValid };
}