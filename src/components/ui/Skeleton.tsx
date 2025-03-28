import { cn } from '../../lib/utils';
import React from 'react';

interface SkeletonProps {
  /**
   * Element HTML sẽ được render
   * @default "div"
   */
  as?: React.ElementType;

  /**
   * Chiều rộng của skeleton
   * @example w-full, w-32, w-1/2
   */
  width?: string;

  /**
   * Chiều cao của skeleton
   * @example h-4, h-10, h-24
   */
  height?: string;

  /**
   * Độ bo tròn góc
   * @example rounded-md, rounded-full
   */
  rounded?: string;

  /**
   * Màu nền
   * @example bg-gray-200, bg-primary/10
   */
  background?: string;

  /**
   * CSS classes bổ sung
   */
  className?: string;
}

export function Skeleton({
  as: Component = 'div',
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded-md',
  background = 'bg-primary/10',
  className,
  ...props
}: SkeletonProps) {
  return (
    <Component
      className={cn('animate-pulse', width, height, rounded, background, className)}
      {...props}
    />
  );
}
