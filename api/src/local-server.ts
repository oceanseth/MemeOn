import express from 'express'
import { handleRoute } from './router'

const PORT = Number(process.env.PORT ?? 3001)

const app = express()

app.all(['/api', '/api/*'], async (req, res) => {
  const result = await handleRoute(req.method, req.path)

  res.status(result.statusCode)
  for (const [name, value] of Object.entries(result.headers)) {
    res.setHeader(name, value)
  }
  res.send(result.body)
})

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})

