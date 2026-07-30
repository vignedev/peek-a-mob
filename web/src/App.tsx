import './App.css'
import { Section } from './components/Section'
import { Heading } from './components/Heading'
import { DescriptionSection } from './components/sections/Description'
import { PlayerSection } from './components/sections/Player'
import { FooterSection } from './components/sections/Footer'

const App = () => {
  return (
    <div className='w-full flex justify-center p-2 py-8'>
      <div className='w-full flex gap-4 flex-col max-w-240'>
        <Section>
          <Heading size='1'>peek-a-mob</Heading>
          <span className='text-sm italic'>yeah we suck at naming things</span>
        </Section>

        <PlayerSection />
        <DescriptionSection />
        <FooterSection />
      </div>
    </div>
  )
}

export default App
