import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Unable to locate root element')
}

// Simple router
type Route = 'home' | 'about' | 'wtf'

function getCurrentRoute(): Route {
  const hash = window.location.hash.slice(1)
  if (hash === 'about') return 'about'
  if (hash === 'wtf') return 'wtf'
  return 'home'
}

function renderHeader() {
  const currentRoute = getCurrentRoute()
  return `
    <header class="header">
      <nav class="nav">
        <a href="#home" class="nav-link ${currentRoute === 'home' ? 'active' : ''}">Home</a>
        <a href="#wtf" class="nav-link ${currentRoute === 'wtf' ? 'active' : ''}">WTF</a>
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
      <div class="wtf-link-section">
        <a href="#wtf" class="wtf-link">
          <span class="wtf-link-icon">🤔</span>
          <span class="wtf-link-text">WTF?</span>
          <span class="wtf-link-subtitle">What the fuck is this project about?</span>
        </a>
      </div>
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
      <h1>About the Team</h1>
      <div class="founders-grid">
        <div class="founder-card">
          <div class="founder-image-wrapper">
            <img src="/wayne.jpg" alt="Wayne Campbell" class="founder-image" />
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
            <img src="/garth.jpg" alt="Garth Algar" class="founder-image" />
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
        <div class="founder-card">
          <div class="founder-image-wrapper">
            <img src="/patrick.jpg" alt="Patrick" class="founder-image" />
          </div>
          <h2>Patrick</h2>
          <p class="founder-description">
            <span class="highlight">Pure of heart!</span> Patrick brings an untainted vision and 
            youthful energy to the team. With the innocence of a fresh perspective and the wisdom 
            that comes from seeing things with fresh eyes, he's the beacon of clarity in our chaotic 
            meme universe. <span class="accent">Untainted by cynicism</span>, Patrick approaches every 
            challenge with the optimism and purity that reminds us why we started this journey in the 
            first place.
          </p>
        </div>
        <div class="founder-card">
          <div class="founder-image-wrapper">
            <img src="/david.jpg" alt="David" class="founder-image" />
          </div>
          <h2>David</h2>
          <p class="founder-description">
            <span class="highlight">Consumed by madness!</span> David has stared into the meme abyss 
            and the abyss stared back. What others see as chaos, he sees as beautiful patterns. 
            <span class="accent">Driven by an insatiable hunger</span> for the perfect meme, he 
            operates in a realm where sanity is optional and genius is mandatory. His madness is our 
            secret weapon—the kind of creative chaos that births the most brilliant ideas when the 
            rest of the world is still trying to make sense of it all.
          </p>
        </div>
        <div class="founder-card">
          <div class="founder-image-wrapper">
            <img src="/tim.jpg" alt="Tim" class="founder-image" />
          </div>
          <h2>Tim</h2>
          <p class="founder-description">
            <span class="highlight">The Sloplord!</span> Tim is bold, powerful, and unapologetically 
            dominant in the meme arena. Like a king of the digital realm, he commands respect and 
            delivers results with the force of a thousand memes. <span class="accent">Bold and 
            unyielding</span>, Tim doesn't just create content—he conquers it. His powerful presence 
            and fearless approach make him the sloplord we all need, ruling over the meme kingdom 
            with an iron fist and a golden touch.
          </p>
        </div>
        <div class="founder-card">
          <div class="founder-image-wrapper">
            <img src="/will.jpg" alt="Will" class="founder-image" />
          </div>
          <h2>Will</h2>
          <p class="founder-description">
            <span class="highlight">The Slop Assassin!</span> Will operates from the shadows, striking 
            with precision when least expected. While others make noise, he makes moves. 
            <span class="accent">Silent but deadly</span>, Will is the master of stealth operations 
            in the meme world. He doesn't need the spotlight—he needs results. From the shadows, 
            he executes with surgical precision, eliminating problems and delivering solutions before 
            anyone even knows what hit them. The slop assassin strikes again.
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

function renderWTF() {
  return `
    <main class="wtf-container">
      <div class="curatorial-statement">
        <h3>Curatorial Statement</h3>
        <p>A visual exploration of mind as multitudes—where fighting personas, debate teams, and enlightenment assemblies converge. Memes become the battlefield where minds make up their minds. MemeOn governs the fight and mints the message.</p>
      </div>
      
      <div class="whiteboard">
        <div class="brainstorm-section">
          <div class="concept-card sketch-card" style="top: 5%; left: 3%;">
            <div class="sketch-icon">🧠</div>
            <div class="annotation">THEORY OF MIND</div>
            <div class="sketch-label">Multitudes</div>
          </div>
          
          <div class="concept-card sketch-card" style="top: 15%; left: 25%;">
            <div class="sketch-icon">👥</div>
            <div class="annotation">Unruly Crowd</div>
            <div class="sketch-label">Fighting Personas</div>
          </div>
          
          <div class="concept-card sketch-card" style="top: 8%; right: 15%;">
            <div class="sketch-icon">🥊</div>
            <div class="annotation">Fight Club</div>
            <div class="sketch-label">Debate Teams</div>
          </div>
          
          <div class="concept-card sketch-card" style="top: 25%; left: 50%;">
            <div class="sketch-icon">🏛️</div>
            <div class="annotation">Enlightenment</div>
            <div class="sketch-label">Representative Assembly</div>
          </div>
          
          <div class="concept-card sketch-card" style="top: 35%; left: 10%;">
            <div class="sketch-icon">💬</div>
            <div class="annotation">Emotional Pleas</div>
            <div class="sketch-label">Braveheart Speeches</div>
          </div>
          
          <div class="concept-card sketch-card" style="top: 45%; left: 35%;">
            <div class="sketch-icon">🤔</div>
            <div class="annotation">Mind Making</div>
            <div class="sketch-label">Up Its Mind</div>
          </div>
          
          <div class="concept-card sketch-card highlight-card" style="top: 55%; left: 60%;">
            <div class="sketch-icon">🎭</div>
            <div class="annotation">THE FIGHT</div>
            <div class="sketch-label">Takes Place With</div>
            <div class="sketch-label large">MEMES</div>
          </div>
          
          <div class="concept-card sketch-card" style="top: 70%; left: 20%;">
            <div class="sketch-icon">💡</div>
            <div class="annotation">A Message</div>
            <div class="sketch-label">Emerges</div>
          </div>
          
          <div class="concept-card sketch-card highlight-card" style="top: 75%; left: 50%;">
            <div class="sketch-icon">⚙️</div>
            <div class="annotation">MEMEON</div>
            <div class="sketch-label">Governs the Fight</div>
            <div class="sketch-label">Mints the Message</div>
          </div>
          
          <div class="concept-card sketch-card" style="top: 60%; right: 10%;">
            <div class="sketch-icon">🗣️</div>
            <div class="annotation">How Crowds</div>
            <div class="sketch-label">Speak</div>
          </div>
          
          <div class="concept-card sketch-card" style="top: 85%; left: 40%;">
            <div class="sketch-icon">🧩</div>
            <div class="annotation">How Minds</div>
            <div class="sketch-label">Make Up Their Minds</div>
          </div>
        </div>
        
        <div class="connection-lines">
          <svg class="sketch-lines" viewBox="0 0 1000 800" preserveAspectRatio="none">
            <path d="M 50 80 Q 200 100 250 200" stroke="#60a5fa" stroke-width="2" fill="none" opacity="0.4" stroke-dasharray="5,5"/>
            <path d="M 250 200 Q 400 250 500 350" stroke="#34d399" stroke-width="2" fill="none" opacity="0.4" stroke-dasharray="5,5"/>
            <path d="M 500 350 Q 600 400 650 550" stroke="#fbbf24" stroke-width="2" fill="none" opacity="0.4" stroke-dasharray="5,5"/>
            <path d="M 650 550 Q 700 600 750 700" stroke="#60a5fa" stroke-width="2" fill="none" opacity="0.4" stroke-dasharray="5,5"/>
            <path d="M 100 400 Q 300 450 500 550" stroke="#34d399" stroke-width="2" fill="none" opacity="0.4" stroke-dasharray="5,5"/>
            <path d="M 800 150 Q 850 300 900 500" stroke="#fbbf24" stroke-width="2" fill="none" opacity="0.4" stroke-dasharray="5,5"/>
          </svg>
        </div>
      </div>
    </main>
  `
}

function render() {
  if (!app) return
  
  const currentRoute = getCurrentRoute()
  let content = ''
  if (currentRoute === 'about') {
    content = renderAbout()
  } else if (currentRoute === 'wtf') {
    content = renderWTF()
  } else {
    content = renderHome()
  }
  
  app.innerHTML = renderHeader() + content
  
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
