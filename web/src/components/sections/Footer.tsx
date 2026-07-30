import type { ReactNode } from 'react'
import { FaGithub, FaTwitter } from "react-icons/fa6"

const QUOTES: string[] = [
  'why is everything a chicken',
  'nope, still haven\'t slept well since last time',
  'i don\'t want to skip rope for rocks',
  'i don\'t want to cook for glass panes',
  'if i complain more i might become green',
  'help i\'m constantly fighting lack of storage',
  'why is it 5am again'
] as const

const IconButton = ({ href, children }: { href: string, children: ReactNode }) => {
  return <a href={href} target='_blank' className='hover:opacity-100 text-2xl transition-opacity'>
    {children}
  </a>
}

export const FooterSection = () => {
  const unpureRandomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)]

  return <div className='select-none *:opacity-30 flex flex-row items-center justify-center w-full gap-2'>
    <div className='w-full h-[1.5em]' style={{ direction: 'rtl' }}>made by vignedev</div>

    <IconButton href='https://twitter.com/vignedev'><FaTwitter /></IconButton>
    <IconButton href='https://github.com/vignedev/peek-a-mob'><FaGithub /></IconButton>

    <div className='w-full h-[1.5sem]'>{unpureRandomQuote}</div>
  </div>
}