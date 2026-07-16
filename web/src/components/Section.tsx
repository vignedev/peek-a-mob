import type { ComponentProps } from 'react';
import { cn } from '../utils/combine';

export const Section = (props: ComponentProps<'div'>) => {
  return <div
    {...props}
    className={
      cn(
        'border-2 rounded-xl bg-gray-50 border-violet-200 shadow-violet-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:shadow-slate-950',
        'p-4 px-4',
        props.className
      )}
  />
}