// Local dev bridge: runs the same dispatcher the Lambda uses on an express server.
// Uses your local AWS creds; points at the dev table/bucket/params by default.
export {}

process.env.AWS_REGION ??= 'us-west-2'
process.env.TABLE_NAME ??= 'memeon-dev'
process.env.SSM_PREFIX ??= '/memeon/dev'
process.env.ASSETS_BUCKET ??= 'memeon-assets-dev'
process.env.SITE_ORIGIN ??= 'http://localhost:5173'

const { default: express } = await import('express')
const { dispatch } = await import('./handler')

const app = express()
app.use(express.text({ type: '*/*', limit: '5mb' }))

app.all(/(.*)/, async (req, res) => {
  const out = await dispatch({
    method: req.method,
    path: req.path,
    query: req.query as Record<string, string>,
    headers: req.headers as Record<string, string>,
    rawBody: typeof req.body === 'string' ? req.body : undefined,
  })
  res.status(out.statusCode ?? 200)
  for (const [k, v] of Object.entries(out.headers ?? {})) res.setHeader(k, String(v))
  res.send(out.body ?? '')
})

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => console.log(`memeon api listening on http://localhost:${port}`))
