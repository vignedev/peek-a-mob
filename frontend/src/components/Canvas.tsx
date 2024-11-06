import { CSSProperties, forwardRef, useEffect, useImperativeHandle, useRef } from "react"

type MouseContext = {
  x: number,
  y: number
}

type CanvasProps = {
  className?: string,
  style?: CSSProperties,
  onDraw?: (ctx: CanvasRenderingContext2D, mouse: MouseContext) => Promise<void> | void,
  onMouseDown?: (event: MouseEvent, ctx: CanvasRenderingContext2D) => void
}

export const Canvas = forwardRef((props: CanvasProps, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
    const mouse: MouseContext = {
      x: 0, y: 0
    }

    const updateMousePosition = (e: MouseEvent) => {
      mouse.x = e.offsetX
      mouse.y = e.offsetY
    }
    const handleClick = (e: MouseEvent) => {
      props.onMouseDown?.(e, ctx)
    }
    const handleMouseLeave = () => {
      mouse.x = mouse.y = -1
    }

    const resize = () => {
      ctx.canvas.width = ctx?.canvas.clientWidth;
      ctx.canvas.height = ctx?.canvas.clientHeight;
    }
    resize()

    let keep_rendering_son = true
    async function render() {
      await props.onDraw?.(ctx, mouse)
      if (keep_rendering_son)
        requestAnimationFrame(render)
    }
    render()

    window.addEventListener('resize', resize)
    ctx.canvas.addEventListener('mousemove', updateMousePosition)
    ctx.canvas.addEventListener('mousedown', handleClick)
    ctx.canvas.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      window.removeEventListener('resize', resize)
      ctx.canvas.removeEventListener('mousemove', updateMousePosition)
      ctx.canvas.removeEventListener('mousedown', handleClick)
      ctx.canvas.removeEventListener('mouseleave', handleMouseLeave)
      keep_rendering_son = false
    }
  }, [canvasRef, props.onDraw, props.style])

  return <canvas
    className={props.className}
    style={props.style}
    ref={canvasRef}
  ></canvas>
})