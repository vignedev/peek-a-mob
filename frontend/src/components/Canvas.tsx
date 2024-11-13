import { CSSProperties, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"

export type MouseContext = {
  x: number,
  y: number
}

export type CanvasDrawingFunction = (ctx: CanvasRenderingContext2D, mouse: MouseContext) => Promise<void> | void

export type CanvasProps = {
  className?: string,
  style?: CSSProperties,
  onDraw?: CanvasDrawingFunction,
  onMouseDown?: (event: MouseEvent, ctx: CanvasRenderingContext2D) => void
  onResize?: (canvas: HTMLCanvasElement) => void
}

export const Canvas = forwardRef((props: CanvasProps, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mouse, setMouse] = useState<MouseContext>({ x: -1, y: -1 })

  useImperativeHandle(ref, () => {
    const canvas = canvasRef.current
    const ctx = canvasRef.current?.getContext('2d')
    return {
      canvas,
      context: ctx,
    }
  }, [canvasRef])

  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!

    const updateMousePosition = (e: MouseEvent) => {
      setMouse({ x: e.offsetX, y: e.offsetY })
    }
    const handleMouseLeave = () => {
      setMouse({ x: -1, y: -1 })
    }

    const resize = () => {
      ctx.canvas.width = ctx?.canvas.clientWidth;
      ctx.canvas.height = ctx?.canvas.clientHeight;
      props.onResize?.(ctx.canvas)
    }
    resize()

    window.addEventListener('resize', resize)
    ctx.canvas.addEventListener('mousemove', updateMousePosition)
    ctx.canvas.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      window.removeEventListener('resize', resize)
      ctx.canvas.removeEventListener('mousemove', updateMousePosition)
      ctx.canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [canvasRef, props.style, props.onResize])

  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!
    const handleClick = (e: MouseEvent) => {
      props.onMouseDown?.(e, ctx)
    }

    ctx.canvas.addEventListener('mousedown', handleClick)
    return () => {
      ctx.canvas.removeEventListener('mousedown', handleClick)
    }
  }, [props.onMouseDown])

  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!

    let keep_rendering_son = true
    async function render() {
      await props.onDraw?.(ctx, mouse)
      if (keep_rendering_son)
        requestAnimationFrame(render)
    }
    render()

    return () => {
      keep_rendering_son = false
    }
  }, [props.onDraw, mouse])

  return <canvas
    className={props.className}
    style={props.style}
    ref={canvasRef}
  ></canvas>
})