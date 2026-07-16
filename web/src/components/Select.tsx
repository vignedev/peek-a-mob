import type { ComponentProps } from 'react'
import { cn } from '../utils/combine'

export type Option = {
  value: string,
  title?: string,
  disabled?: boolean
}

type TProps = {
  placeholder?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  items: Option[]
  className?: ComponentProps<'select'>['className']
  disabled?: boolean
}
export const Select = (props: TProps) => {
  const { disabled, placeholder, defaultValue, value, onValueChange, items, className } = props

  return (
    <select className={cn('p-2 px-3 dark:bg-slate-800 bg-gray-100', className)}
      value={value ?? ''}
      defaultValue={defaultValue}
      onChange={(e) => onValueChange?.(e.currentTarget.value)}
      disabled={disabled}
    >
      {placeholder && <option value='' hidden disabled>{placeholder}</option>}
      {
        items.map((item) => (
          <option
            key={item.value}
            value={item.value}
            disabled={item.disabled}
          >
            {item.title ?? item.value}
          </option>
        ))
      }
    </select>
  )
}