import './App.css'
import { Timeline } from './components/timeline'
import InAmeSame from './assets/inamesame.jpg'

function App() {
  return (
    <>
      <div>
      </div>
      <h1>PaM</h1>
      <div className="card">
      </div>

      
      <div style={{display: 'flex', gap: '1rem', flexDirection: 'column'}}>
        {
          new Array(25).fill(null).map(x => (
            <Timeline
              title='smash bros uwu'
              thumbnail={InAmeSame}
              width={640} height={32}
              duration={600}
              lines={new Array(100).fill(0).map(_ => Math.random() * 600)}
              strokeStyle='#ff000060'
            />
          ))
        }
      </div>
    </>
  )
}

export default App
