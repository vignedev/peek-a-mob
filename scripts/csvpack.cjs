const readline = require('readline/promises')
const fs = require('fs')
const fsp = require('fs/promises')

const [file, out] = process.argv.slice(2, 4)

if(!file || !out) {
  console.error(`usage: ${process.argv.slice(0, 2).join(' ')} <file.csv> <out.bin>`)
  process.exit(1)
}

const entityIdMapping = {
  skeleton: 0,
  zombie: 1,
  wolf: 2,
  creeper: 3,
  spider: 4,
  chicken: 5,
  enderman: 6,
  pig: 8,
  cow: 7,
}

async function main() {
  const stream = fs.createReadStream(file)
  const reader = readline.createInterface(stream)
  const writer = fs.createWriteStream(out)
  
  let ln = 0
  let cn = 0
  const classes = {}

  for await (const line of reader) {
    const i = ln++
    if(i <= 1)
      continue
  
    const [ time, cls, confidence, x, y, w, h ] = line.split(';')
    const classIdx = entityIdMapping[cls]

    if(typeof classIdx === 'undefined')
      throw new Error(`unknown class: ${cls}`)

    const buf = Buffer.alloc(2 + 6*4)
    let needle = 0
    
    needle = buf.writeUInt16LE(classIdx, needle)
    needle = buf.writeFloatLE(parseFloat(time), needle)
    needle = buf.writeFloatLE(parseFloat(confidence), needle)
    needle = buf.writeFloatLE(parseFloat(x), needle)
    needle = buf.writeFloatLE(parseFloat(y), needle)
    needle = buf.writeFloatLE(parseFloat(w), needle)
    needle = buf.writeFloatLE(parseFloat(h), needle)
    
    if(!writer.write(buf))
      await new Promise((resolve) => writer.once('drain', resolve))
  }
}
main()