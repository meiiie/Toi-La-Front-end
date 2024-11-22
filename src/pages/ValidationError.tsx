import React from 'react';
import { FieldError, Merge } from 'react-hook-form';

type Props = {
  fieldError:
    | FieldError
    | (FieldError | undefined)[]
    | undefined
    | Merge<FieldError, (FieldError | undefined)[]>;
  className?: string;
};

export const ValidationError: React.FC<Props> = ({ fieldError, className }) => {
  if (!fieldError) return null;

  if (Array.isArray(fieldError)) {
    const firstError = fieldError.find((error) => error);
    if (!firstError) return null;
    return <p className={className}>{firstError.message}</p>;
  }

  return <p className={className}>{fieldError.message}</p>;
};
