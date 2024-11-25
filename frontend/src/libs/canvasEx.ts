export type CanvasRenderingContext2DExpanded = CanvasRenderingContext2D & {
  drawLine(x1: number, y1: number, x2: number, y2: number, lineWidth?: number, strokeStyle?: string): void,
  drawBoundingBox(x1: number, y1: number, x2: number, y2: number, text: string, color: string): void,
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
  prepare.drawBoundingBox = (_x1, _y1, _x2, _y2, text, color) => {
    const [x1, y1, x2, y2] = [_x1, _y1, _x2, _y2].map(x => Math.floor(x))
    // text measurements
    ctx.font = 'bold 1rem sans-serif'
    const textMeasure = ctx.measureText(text)
    const
      textWidth = textMeasure.width + 8,
      textHeight = Math.abs(textMeasure.actualBoundingBoxAscent + textMeasure.fontBoundingBoxDescent - textMeasure.actualBoundingBoxDescent)
    // rendering logic behind the label backdrop + outline
    function _bbox() {
      ctx.strokeRect(x1, y1, x2, y2)
      ctx.fillRect(
        x1 - Math.ceil(ctx.lineWidth / 2),
        Math.max(0.0, y1 - Math.ceil(ctx.lineWidth / 2) - textHeight),
        textWidth + ctx.lineWidth,
        textHeight + ctx.lineWidth + textMeasure.actualBoundingBoxDescent
      )
    }

    // outline
    ctx.fillStyle = ctx.strokeStyle = '#000a'
    ctx.lineWidth = 9
    _bbox()

    // real-color
    ctx.fillStyle = ctx.strokeStyle = color
    ctx.lineWidth = 3
    _bbox()

    // text rendering
    ctx.lineWidth = 2
    ctx.strokeStyle = 'black'
    ctx.fillStyle = 'white'

    ctx.strokeText(text, x1 + 4, Math.max(textMeasure.actualBoundingBoxAscent * 1.25, y1))
    ctx.fillText(text, x1 + 4, Math.max(textMeasure.actualBoundingBoxAscent, y1))
  }
  return prepare
}