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

    const updateMousePosition = (e: PointerEvent) => setMouse({ x: e.offsetX, y: e.offsetY })
    const handleMouseLeave = () => setMouse(null)
    const handleClick = (e: PointerEvent) => {
      if (e.pointerType != 'touch') // pen and touch have hover, click immediately
        props.onMouseDown?.(e, ctx)
      props.onDraw?.(ctx, mouse) // invoke re-draw when click
    }
    const handleClickTouch = (e: PointerEvent) => {
      if (e.pointerType == 'touch') // touch has no hover, act the "drag" as hover
        props.onMouseDown?.(e, ctx)
      props.onDraw?.(ctx, mouse) // invoke re-draw when click
    }

    ctx.canvas.addEventListener('pointermove', updateMousePosition)
    ctx.canvas.addEventListener('pointerleave', handleMouseLeave)
    ctx.canvas.addEventListener('pointerdown', handleClick)
    ctx.canvas.addEventListener('pointerup', handleClickTouch)

    return () => {
      ctx.canvas.removeEventListener('pointermove', updateMousePosition)
      ctx.canvas.removeEventListener('pointerleave', handleMouseLeave)
      ctx.canvas.removeEventListener('pointerdown', handleClick)
      ctx.canvas.removeEventListener('pointerup', handleClickTouch)
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
    let doLoop = true
    function loop() {
      if (!doLoop || !canvas) return
      if (canvas.width != canvas.clientWidth || canvas.height != canvas.clientHeight) {
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        props.onResize?.(canvas)
      }
      requestAnimationFrame(loop)
    }
    loop()

    return () => { doLoop = false }
  }, [canvas, props.onResize])

  // the canvas, wowie
  return <canvas
    className={props.className}
    style={{
      touchAction: 'none',
      ...props.style
    }}
    ref={obtainCanvas}
  ></canvas>
}