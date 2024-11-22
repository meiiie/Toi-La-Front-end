import React from 'react';
import { FieldError, Merge } from 'react-hook-form';

type Props = {
  fieldError: Merge<FieldError, (FieldError | undefined)[]> | FieldError | undefined;
  className?: string;
};

export function ValidationError({ fieldError, className }: Props) {
  if (!fieldError) return null;

  if (Array.isArray(fieldError)) {
    return (
      <>
        {fieldError.map(
          (error, index) =>
            error && (
              <p key={index} className={className}>
                {error.message}
              </p>
            ),
        )}
      </>
    );
  }

  return <p className={className}>{fieldError.message}</p>;
}
