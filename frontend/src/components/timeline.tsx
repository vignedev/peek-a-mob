import { CSSProperties, useEffect, useRef } from 'react'

type TProps = {
  width: number,
  height: number,
  fillStyle?: string,
  strokeStyle?: string,
  thickness?: number,
  style?: CSSProperties,
  title?: string

  lines: number[],
  duration: number,
  thumbnail?: string,
}
export const Timeline = (props: TProps) => {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvas.current) return

    canvas.current.width = props.width
    canvas.current.height = props.height

    const ctx = canvas.current.getContext('2d')!
    ctx.strokeStyle = props.strokeStyle || 'red'
    ctx.fillStyle = props.fillStyle || 'white'
    ctx.lineWidth = props.thickness || 2;

    ctx.clearRect(0, 0, props.width, props.height)
    // ctx.fillRect(0, 0, props.width, props.height);

    for (const line of props.lines) {
      ctx.beginPath()
      ctx.moveTo((line / props.duration) * props.width, 0)
      ctx.lineTo((line / props.duration) * props.width, props.height)
      ctx.stroke()
    }
  }, [
    canvas,
    props.width, props.height,
    props.lines, props.duration,
    props.strokeStyle, props.fillStyle,
    props.thickness
  ])

  return (
    <div style={{display: 'flex', flexDirection: 'column', background: '#151515', borderRadius: '.25rem', overflow: 'hidden', boxShadow: '0 .25rem 1rem #0007'}}>
      <div style={{display: 'flex', justifyContent: 'flex-start', alignItems: 'center', margin: '0 .5rem' }}>
        <span>{props.title}</span>
      </div>
      <div style={{display: 'flex', flexDirection: 'row'}}>
        <img src={props.thumbnail} height={props.height}/>
        <canvas style={{
          background: '#0009',
        }} ref={canvas}></canvas>
      </div>
    </div>
  )
}