export type CanvasRenderingContext2DExpanded = CanvasRenderingContext2D & {
  drawLine(x1: number, y1: number, x2: number, y2: number, lineWidth?: number, strokeStyle?: string): void,
}

export function expandContext(ctx: CanvasRenderingContext2D): CanvasRenderingContext2DExpanded {
  const prepare = ctx as CanvasRenderingContext2DExpanded
  prepare.drawLine = (x1, y1, x2, y2, lineWidth, strokeStyle) => {
    if (lineWidth != null || typeof lineWidth !== 'undefined')
      ctx.lineWidth = lineWidth
    if (strokeStyle != null || typeof strokeStyle !== 'undefined')
      ctx.strokeStyle = strokeStyle
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }
  return prepare
}