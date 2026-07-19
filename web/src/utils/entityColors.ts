import type { RecognizedEntities } from './binreader'

export type EntityColor = {
  color: string,
  outline?: string,
  dark: boolean,
}

export const EntityColorMapping: Record<RecognizedEntities, EntityColor> = {
  chicken: {
    color: '#F79D60',
    dark: false
  },
  cow: {
    color: '#5A2E1C',
    dark: true,
  },
  creeper: {
    color: '#3F951F',
    dark: false,
  },
  enderman: {
    color: '#2C1E36',
    dark: true
  },
  pig: {
    color: '#DB8CC6',
    dark: false
  },
  skeleton: {
    color: '#D4D4D4',
    dark: false
  },
  spider: {
    color: '#801C13',
    dark: true
  },
  wolf: {
    color: '#C5D0D4',
    dark: false,
  },
  zombie: {
    color: '#496322',
    dark: true
  }
} as const