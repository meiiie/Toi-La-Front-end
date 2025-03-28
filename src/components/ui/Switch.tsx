'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { FaCircle } from 'react-icons/fa';

import { cn } from '../../lib/utils';

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  checked: boolean;
  sunIcon?: React.ReactNode;
  moonIcon?: React.ReactNode;
}

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, SwitchProps>(
  ({ className, checked, sunIcon, moonIcon, ...props }, ref) => (
    <SwitchPrimitives.Root
      className={cn(
        'peer inline-flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        checked
          ? (sunIcon && 'bg-yellow-500') || 'bg-blue-500'
          : (moonIcon && 'bg-gray-600') || 'bg-blue-200',
        className,
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none flex items-center justify-center h-7 w-7 rounded-full bg-white shadow-lg ring-0 transition-transform',
          checked ? 'translate-x-8' : 'translate-x-1',
        )}
      >
        {checked
          ? sunIcon || <FaCircle className="text-blue-500" />
          : moonIcon || <FaCircle className="text-blue-300" />}
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  ),
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
