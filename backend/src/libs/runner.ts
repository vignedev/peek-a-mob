import { spawn, ChildProcess } from 'child_process'
import * as database from './database'
import * as env from '../libs/env'
import { createWriteStream } from 'fs'
import { mkdir, mkdtemp, rename, rm, rmdir } from 'fs/promises'
import { pipeline } from 'stream/promises'
import path from 'path'
import { createInterface } from 'readline'
import { error } from './log'
import { tmpdir } from 'os'

export type JobStatus = 'waiting' | 'cancelled' | 'active' | 'failed' | 'finished' | 'importing'

export type Job = {
  id: number,
  videoUrl: string,
  modelId: number,
  status: JobStatus,
  logs: Buffer[],
  start: number | null,
  end: number | null,
  result: string | null,
  progress: {
    currentFrame: number,
    totalFrames: number,
    rate: {
      average: number,
      last: number
    }
  } | null
}

// internal state
const jobList: Job[] = []
let lastIndex = 0
let currentJob: { id: number, process: ChildProcess | null } | null = null

// call this whenever a job is added/cancelled/finished
async function onJobUpdate(fromIndex: number) {
  if (currentJob)
    return // a job is already in the works

  if (fromIndex != (lastIndex - 1))
    return // stale request

  if (lastIndex == jobList.length)
    return // no more jobs/no jobs

  const idx = lastIndex++  // the index of the current job + increment it
  currentJob = { id: idx, process: null }

  // the current job is invalid, move forwards
  if (jobList[idx].status != 'waiting') {
    onJobUpdate(idx)
    return
  }

  // set it as active (until it fails or is cancelled)
  jobList[idx].start = Date.now()
  jobList[idx].status = 'active'
  const job = jobList[idx]

  //create temporary folder
  const folder = await mkdtemp(path.join(tmpdir(), 'pam-import-'))
  const filename = path.join(folder, 'temp.csv')

  const child = spawn('python3', [
    'scripts/analyze-youtube.py',
    job.videoUrl,
    '-m', (await database.models.get(job.modelId))!.modelPath,
    '-o', filename,
    '--json', '--conf', '0.6'
  ], { cwd: env.str('PROJECT_ROOT') })
  currentJob.process = child
  child.stdout.on('data', chunk => jobList[idx].logs.push(chunk))
  child.stderr.on('data', chunk => jobList[idx].logs.push(chunk))

  const logReader = createInterface(child.stdout)
  logReader.on('line', line => {
    try {
      if (line.trim().length == 0)
        return

      const data = JSON.parse(line)
      jobList[idx].progress = data
    } catch (err) {
      jobList[idx].logs.push(Buffer.from(line), Buffer.from('\n'))
      error('Failed to parse data from analyzer', line, err)
    }
  })

  child.once('error', (err) => {
    jobList[idx].end = Date.now()
    jobList[idx].status = 'failed'
    jobList[idx].logs.push(Buffer.from(`\n[pam/backend] Arbitrary spawning issue for analysis: ${JSON.stringify(err)}\n`))
    currentJob = null
    onJobUpdate(idx)
  }).once('exit', (code, signal) => {
    // update the job list
    jobList[idx].logs.push(Buffer.from(`\n[pam/backend] Analysis exited with code=${code} signal=${signal}\n`))

    // on success, import the csv into the system
    if (code == 0) {
      jobList[idx].result = filename
      jobList[idx].status = 'importing'
      const importer = spawn('npm', [
        'run',
        'import_csv', filename
      ], { cwd: path.join(env.str('PROJECT_ROOT'), 'backend') })
      currentJob!.process = importer
      importer.stdout.on('data', chunk => jobList[idx].logs.push(chunk))
      importer.stderr.on('data', chunk => jobList[idx].logs.push(chunk))
      importer.once('error', (err) => {
        jobList[idx].end = Date.now()
        jobList[idx].status = 'failed'
        jobList[idx].logs.push(Buffer.from(`\n[pam/backend] Arbitrary spawning issue for import: ${JSON.stringify(err)}\n`))
        currentJob = null
        onJobUpdate(idx)
      }).once('exit', (code, signal) => {
        jobList[idx].end = Date.now()
        jobList[idx].status = code == 0 ? 'finished' : 'failed'
        jobList[idx].logs.push(Buffer.from(`\n[pam/backend] Importing exited with code=${code} signal=${signal}\n`))
        currentJob = null
        onJobUpdate(idx)
      })
    } else {
      jobList[idx].end = Date.now()
      jobList[idx].status = 'failed'
      currentJob = null
      onJobUpdate(idx)
    }
  })

  // TODO: remove the tomporary file/folder
}

export const Runner = {
  get(id: number) {
    return jobList[id] || null
  },
  getAll() {
    return jobList
  },
  addJob(videoUrl: string, modelId: number) {
    const id = jobList.length
    jobList.push({
      id, modelId, videoUrl,
      logs: [], status: 'waiting',
      progress: null,
      start: null, end: null,
      result: null
    })

    onJobUpdate(id - 1)
    return jobList[id]
  },
  kill() {
    return currentJob?.process?.kill('SIGTERM')
  }
}
export default Runner