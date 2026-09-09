import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import './Spinner.css'

/** 18px ring; 0.8s is a legacy constant, not one of the --dur-* tokens. */
export function Spinner({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      aria-hidden="true"
      data-slot="spinner"
      className={cn(
        'inline-block h-[18px] w-[18px] flex-none rounded-full border-2 border-border border-t-accent',
        'animate-[atom-rot_0.8s_linear_infinite]',
        'motion-reduce:[animation-duration:2s]',
        'forced-colors:border-[CanvasText] forced-colors:border-t-[Highlight]',
        className,
      )}
      {...rest}
    />
  )
}
