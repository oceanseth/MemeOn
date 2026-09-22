import type { OgFrameManifest } from './ogCard'

export const testOgFrameManifest: OgFrameManifest = {
  version: 1,
  units: 'px',
  canvas: {
    width: 960,
    height: 1200,
    cssWidth: 320,
    cssHeight: 400,
    deviceScaleFactor: 3,
  },
  frame: { x: 60, y: 75, width: 840, height: 1050 },
  backing: { x: 60, y: 75, width: 804, height: 1050, radius: 72 },
  aperture: { x: 117, y: 132, width: 690, height: 936, radius: 42 },
  sourceSafeRect: { x: 141, y: 156, width: 642, height: 888 },
  tiers: { paper: 'paper.png', gold: 'gold.png' },
}
