import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Unable to locate root element')
}

app.innerHTML = `
  <main class="container">
    <h1>Hello MemeOn.ai</h1>
    <p class="description">This page is powered by Vite and backed by a serverless API.</p>
    <section class="api-section">
      <h2>API Response</h2>
      <pre id="api-result">Loading…</pre>
    </section>
  </main>
`

const resultElement = document.querySelector<HTMLPreElement>('#api-result')

async function loadApi() {
  if (!resultElement) return

  try {
    const response = await fetch('/api/helloworld')
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`)
    }

    const text = await response.text()
    resultElement.textContent = text
  } catch (error) {
    console.error(error)
    resultElement.textContent = 'Unable to reach API'
  }
}

loadApi()

if (import.meta.hot) {
  import.meta.hot.accept(loadApi)
}
