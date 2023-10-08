import { Worker } from 'worker_threads';
import app from './src/app.js'
import { testConnection } from './src/db.js'
import { EOL } from 'os'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

let server

;(async function startServer() {
  handleInterrupt()
  handleGlobalErrors()
  await connectDb()
  new Worker("./taskCompletitionManager.js")
  server = createServer(process.env.PORT || 3000)
})()

function handleInterrupt() {
  process.on('SIGINT', () => {
    server?.close(() => {
      console.info(`[ INFO ] ${new Date()} - received SIGINT, shutting down...`)
    })
  })
}

function handleGlobalErrors() {
  handleUnhandledRejections()
  handleUncaughtExceptions()
}

function handleUnhandledRejections() {
  process.on('unhandledRejection', (err) => {
    console.error(`[ ERROR ] ${new Date()}`, err.name, err.message)

    server?.close(() => {
      console.error('Unhandled rejection - shutting down...')
      process.exit(1)
    })
  })
}

function handleUncaughtExceptions() {
  process.on('uncaughtException', (err) => {
    console.error(`[ ERROR ] ${new Date()}`, err.name, err.message)

    server?.close(() => {
      console.error('Uncaught Exception - shutting down...')
      process.exit(1)
    })
  })
}

async function connectDb() {
  try {
    await testConnection()
    console.info('SQLite state:\tconnected!')
  } catch (e) {
    process.exit(1)
  }
}

function createServer(port) {
  return app.listen(port, () => {
    console.info([`App mode:\t${process.env.NODE_ENV}`, `App port:\t${port}`, `App start:\t${new Date()}`].join(EOL))
  })
}
