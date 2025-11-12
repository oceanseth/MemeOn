import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Unable to locate root element')
}

// Simple router
type Route = 'home' | 'about'

function getCurrentRoute(): Route {
  const hash = window.location.hash.slice(1)
  return hash === 'about' ? 'about' : 'home'
}

function renderHeader() {
  const currentRoute = getCurrentRoute()
  return `
    <header class="header">
      <nav class="nav">
        <a href="#home" class="nav-link ${currentRoute === 'home' ? 'active' : ''}">Home</a>
        <a href="#about" class="nav-link ${currentRoute === 'about' ? 'active' : ''}">About</a>
      </nav>
    </header>
  `
}

function renderHome() {
  return `
    <main class="container">
      <h1>Hello MemeOn.ai</h1>
      <p class="description">This page is powered by Vite and backed by a serverless API.</p>
      <section class="api-section">
        <h2>API Response</h2>
        <pre id="api-result">Loading…</pre>
      </section>
    </main>
  `
}

function renderAbout() {
  return `
    <main class="container about-container">
      <h1>About the Founders</h1>
      <div class="founders-grid">
        <div class="founder-card">
          <div class="founder-image-wrapper">
            <img src="https://upload.wikimedia.org/wikipedia/en/9/9a/Wayne_Campbell.jpg" alt="Wayne Campbell" class="founder-image" onerror="this.src='https://via.placeholder.com/200/1e293b/60a5fa?text=Wayne'" />
          </div>
          <h2>John Brennan</h2>
          <p class="founder-description">
            <span class="highlight">Party on!</span> John brings the energy and vision to MemeOn.ai, 
            channeling the spirit of Wayne himself. When he's not coding up a storm, you'll find him 
            headbanging to Bohemian Rhapsody and dreaming up the next big meme revolution. 
            <span class="accent">Excellent!</span> He's the mastermind behind making memes accessible 
            to everyone, one algorithm at a time.
          </p>
        </div>
        <div class="founder-card">
          <div class="founder-image-wrapper">
            <img src="https://upload.wikimedia.org/wikipedia/en/0/0c/Garth_Algar.jpg" alt="Garth Algar" class="founder-image" onerror="this.src='https://via.placeholder.com/200/1e293b/34d399?text=Garth'" />
          </div>
          <h2>Seth Caldwell</h2>
          <p class="founder-description">
            <span class="highlight">Schwing!</span> Seth is the technical wizard and creative genius 
            who makes the magic happen. Like Garth, he's the quiet force behind the scenes, building 
            incredible tech while keeping things delightfully weird. When he's not optimizing neural 
            networks, he's probably thinking about the next breakthrough that will 
            <span class="accent">blow your mind</span>. He's the one who makes sure everything works 
            flawlessly while maintaining that perfect balance of innovation and fun.
          </p>
        </div>
      </div>
      <div class="about-footer">
        <p class="tagline">🎸 <em>We're not worthy!</em> 🎸</p>
        <p class="sub-tagline">But we're building something that is.</p>
      </div>
    </main>
  `
}

function render() {
  if (!app) return
  
  const currentRoute = getCurrentRoute()
  app.innerHTML = renderHeader() + (currentRoute === 'about' ? renderAbout() : renderHome())
  
  // Load API data if on home page
  if (currentRoute === 'home') {
    const resultElement = document.querySelector<HTMLPreElement>('#api-result')
    loadApi(resultElement)
  }
}

async function loadApi(resultElement: HTMLPreElement | null) {
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

// Initial render
render()

// Handle hash changes for routing
window.addEventListener('hashchange', render)

if (import.meta.hot) {
  import.meta.hot.accept(render)
}
