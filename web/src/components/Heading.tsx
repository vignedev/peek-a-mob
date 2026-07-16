import type { ComponentProps, ElementType, JSX } from 'react'
import { cn } from '../utils/combine'
import type { ClassValue } from 'clsx'

type TProps = ComponentProps<'h1' | 'h2' | 'h3'> & {
  size?: '1' | '2' | '3'
}
export const Heading = (props: TProps) => {
  const { size = '1', ...common } = props

  const elemMap: Record<'1' | '2' | '3', keyof JSX.IntrinsicElements> = {
    '1': 'h1',
    '2': 'h2',
    '3': 'h3',
  } as const
  const Element = elemMap[size] as ElementType<ComponentProps<'h1' | 'h2' | 'h3'>>

  const sizeMap: Record<'1' | '2' | '3', ClassValue> = {
    '1': 'text-3xl',
    '2': 'text-2xl',
    '3': 'text-xl',
  } as const

  return <Element {...common} className={cn(
    'not-first:pt-4',
    'font-bold',
    sizeMap[size],
    size != '1' ? 'italic' : undefined,
    props.className
  )} />
}