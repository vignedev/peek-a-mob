import { CSSProperties, useCallback, useEffect, useState } from "react"
import { CanvasRenderingContext2DExpanded, expandContext } from "../libs/canvasEx"

export type MouseContext = {
  x: number,
  y: number
}

export type CanvasDrawingFunction = (ctx: CanvasRenderingContext2DExpanded, mouse: MouseContext | null) => Promise<void> | void

export type CanvasProps = {
  className?: string,
  style?: CSSProperties,
  onDraw?: CanvasDrawingFunction,
  onMouseDown?: (event: MouseEvent, ctx: CanvasRenderingContext2DExpanded) => void
  onResize?: (canvas: HTMLCanvasElement) => void
}

export const Canvas = (props: CanvasProps) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement>()
  const [mouse, setMouse] = useState<MouseContext | null>(null)

  // get the canvas
  const obtainCanvas = useCallback((node: HTMLCanvasElement) => setCanvas(node), [])

  // handle mouse events
  useEffect(() => {
    if (!canvas) return
    const ctx = expandContext(canvas.getContext('2d')!)

    const updateMousePosition = (e: MouseEvent) => setMouse({ x: e.offsetX, y: e.offsetY })
    const handleMouseLeave = () => setMouse(null)
    const handleClick = (e: MouseEvent) => {
      props.onMouseDown?.(e, ctx)
      props.onDraw?.(ctx, mouse) // invoke re-draw when click
    }

    ctx.canvas.addEventListener('mousemove', updateMousePosition)
    ctx.canvas.addEventListener('mouseleave', handleMouseLeave)
    ctx.canvas.addEventListener('mousedown', handleClick)

    return () => {
      ctx.canvas.removeEventListener('mousemove', updateMousePosition)
      ctx.canvas.removeEventListener('mouseleave', handleMouseLeave)
      ctx.canvas.removeEventListener('mousedown', handleClick)
    }
  }, [canvas, props.onMouseDown, props.onDraw])

  // rendering loop updates | update when mouse updates or onDraw updates
  useEffect(() => {
    if (!canvas) return
    const ctx = expandContext(canvas.getContext('2d')!)

    props.onDraw?.(ctx, mouse)
  }, [canvas, props.onDraw, mouse])

  // monitoring the size and updating the canvasSize
  useEffect(() => {
    const loop = setInterval(() => {
      if (!canvas) return
      if (canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight) {
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        props.onResize?.(canvas)
        // props.onDraw?.(canvas.getContext('2d')!, mouse)
      }
    }, 16)
    return () => clearInterval(loop)
  }, [canvas, props.onResize])

  // the canvas, wowie
  return <canvas
    className={props.className}
    style={props.style}
    ref={obtainCanvas}
  ></canvas>
}