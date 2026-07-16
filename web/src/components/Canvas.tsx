import { useEffect, useRef, type ComponentPropsWithoutRef, type ComponentPropsWithRef } from 'react';

type TProps = ComponentPropsWithoutRef<'canvas'> & {
  onRender: (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, width: number, height: number) => void
  onResize?: (width: number, height: number) => void
}
export const Canvas = (props: TProps) => {
  const { onRender, onResize, ...rest } = props
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    let animId: number = 0
    let isVisible: boolean = false

    if (!canvas)
      return

    const ctx = canvas.getContext('2d')
    if (!ctx)
      return

    const resObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const dpr = window.devicePixelRatio || 1.0
        canvas.width = entry.contentRect.width * dpr
        canvas.height = entry.contentRect.height * dpr

        onResize?.(canvas.width, canvas.height)
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
      }
    })

    const intObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const shouldReinitRender = (isVisible === false && entry.isIntersecting === true)
        isVisible = entry.isIntersecting
        if (shouldReinitRender)
          renderFn()
      }
    })

    const renderFn = () => {
      if (!isVisible)
        return

      const dpr = window.devicePixelRatio || 1.0
      onRender(canvas, ctx, canvas.width / dpr, canvas.height / dpr)
      animId = requestAnimationFrame(renderFn)
    }

    resObserver.observe(canvas)
    intObserver.observe(canvas)
    // renderFn() is called by intObserver observers

    return () => {
      resObserver.disconnect()
      intObserver.disconnect()
      cancelAnimationFrame(animId)
    }
  }, [canvasRef, onRender, onResize])

  return <canvas {...rest} ref={canvasRef} />
}