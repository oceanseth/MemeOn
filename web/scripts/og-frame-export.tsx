import { createRoot } from 'react-dom/client'
import { FoilCard, FoilMedia } from '../src/atoms/foil-frame'
import { TierSeal } from '../src/atoms/tier-seal'
import '../src/index.css'

const TIER_KEYS = ['paper', 'silver', 'holo', 'chrome', 'gold', 'prismatic', 'shiny'] as const
const tierParam = new URLSearchParams(window.location.search).get('tier') ?? 'paper'
const tierKey = TIER_KEYS.includes(tierParam as (typeof TIER_KEYS)[number]) ? tierParam : 'paper'
const tierName = `${tierKey.slice(0, 1).toUpperCase()}${tierKey.slice(1)}`

const exportStyles = document.createElement('style')
exportStyles.textContent = `
  html, body, #root {
    width: 480px;
    height: 600px;
    margin: 0;
    overflow: hidden;
    background: transparent !important;
  }
  [data-slot="og-export-stage"] {
    position: relative;
    width: 480px;
    height: 600px;
    background: transparent;
  }
  [data-slot="og-export-frame"] {
    position: absolute;
    left: 30px;
    top: 37.5px;
    width: 420px;
  }
  [data-slot="og-export-frame"] [data-slot="collectible-window"] {
    background: transparent !important;
    box-shadow: 0 0 0 1px oklch(1 0 0 / 0.44);
  }
`
document.head.append(exportStyles)
document.documentElement.dataset.theme = 'dark'

createRoot(document.getElementById('root')!).render(
  <div data-slot="og-export-stage">
    <FoilCard tierKey={tierKey} presentation="collectible" rarityLadder data-slot="og-export-frame">
      <FoilMedia
        presentation="collectible"
        seal={<TierSeal tierKey={tierKey} label={`${tierName} tier`} />}
      />
    </FoilCard>
  </div>,
)

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.dataset.exportReady = 'true'
  })
})
