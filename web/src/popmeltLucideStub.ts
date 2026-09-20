/**
 * Local lucide-react stand-in for Popmelt toolbar icons.
 *
 * Icon path data from lucide-react v1.23.0 (ISC). The lucide-react
 * package itself is banned from this workspace and must not be installed.
 *
 * ISC License
 * Copyright (c) 2026 Lucide Icons and Contributors
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 */
import { createElement, forwardRef, type ReactNode, type SVGProps } from 'react'

type IconNode = ReadonlyArray<readonly [string, Record<string, unknown>]>

type LucideProps = SVGProps<SVGSVGElement> & {
  size?: number | string
  color?: string
  strokeWidth?: number | string
  absoluteStrokeWidth?: boolean
}

export function createLucideIcon(iconName: string, iconNode: IconNode) {
  const Icon = forwardRef<SVGSVGElement, LucideProps>(function LucideIcon(
    {
      color = 'currentColor',
      size = 24,
      strokeWidth = 2,
      absoluteStrokeWidth,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const width = size
    const height = size
    const resolvedStrokeWidth = absoluteStrokeWidth
      ? (Number(strokeWidth) * 24) / Number(size)
      : strokeWidth
    return createElement(
      'svg',
      {
        ref,
        xmlns: 'http://www.w3.org/2000/svg',
        width,
        height,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: color,
        strokeWidth: resolvedStrokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className,
        'aria-hidden': true,
        ...rest,
      },
      [...iconNode.map(([tag, attrs]) => createElement(tag, attrs)), children as ReactNode],
    )
  })
  Icon.displayName = iconName
  return Icon
}

export const ALargeSmall = createLucideIcon('a-large-small', [
  ['path', { d: 'm15 16 2.536-7.328a1.02 1.02 1 0 1 1.928 0L22 16', key: 'xik6mr' }],
  ['path', { d: 'M15.697 14h5.606', key: '1stdlc' }],
  ['path', { d: 'm2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16', key: 'd5nyq2' }],
  ['path', { d: 'M3.304 13h6.392', key: '1q3zxz' }],
])

export const AlignCenter = createLucideIcon('align-center', [
  ['path', { d: 'M21 5H3', key: '1fi0y6' }],
  ['path', { d: 'M17 12H7', key: '16if0g' }],
  ['path', { d: 'M19 19H5', key: 'vjpgq2' }],
])

export const AlignCenterVertical = createLucideIcon('align-center-vertical', [
  ['path', { d: 'M12 2v20', key: 't6zp3m' }],
  ['path', { d: 'M8 10H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h4', key: '14d6g8' }],
  ['path', { d: 'M16 10h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4', key: '1e2lrw' }],
  ['path', { d: 'M8 20H7a2 2 0 0 1-2-2v-2c0-1.1.9-2 2-2h1', key: '1fkdwx' }],
  ['path', { d: 'M16 14h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1', key: '1euafb' }],
])

export const AlignEndVertical = createLucideIcon('align-end-vertical', [
  ['rect', { width: '16', height: '6', x: '2', y: '4', rx: '2', key: '10wcwx' }],
  ['rect', { width: '9', height: '6', x: '9', y: '14', rx: '2', key: '4p5bwg' }],
  ['path', { d: 'M22 22V2', key: '12ipfv' }],
])

export const AlignHorizontalJustifyCenter = createLucideIcon('align-horizontal-justify-center', [
  ['rect', { width: '6', height: '14', x: '2', y: '5', rx: '2', key: 'dy24zr' }],
  ['rect', { width: '6', height: '10', x: '16', y: '7', rx: '2', key: '13zkjt' }],
  ['path', { d: 'M12 2v20', key: 't6zp3m' }],
])

export const AlignHorizontalJustifyEnd = createLucideIcon('align-horizontal-justify-end', [
  ['rect', { width: '6', height: '14', x: '2', y: '5', rx: '2', key: 'dy24zr' }],
  ['rect', { width: '6', height: '10', x: '12', y: '7', rx: '2', key: '1ht384' }],
  ['path', { d: 'M22 2v20', key: '40qfg1' }],
])

export const AlignHorizontalJustifyStart = createLucideIcon('align-horizontal-justify-start', [
  ['rect', { width: '6', height: '14', x: '6', y: '5', rx: '2', key: 'hsirpf' }],
  ['rect', { width: '6', height: '10', x: '16', y: '7', rx: '2', key: '13zkjt' }],
  ['path', { d: 'M2 2v20', key: '1ivd8o' }],
])

export const AlignHorizontalSpaceAround = createLucideIcon('align-horizontal-space-around', [
  ['rect', { width: '6', height: '10', x: '9', y: '7', rx: '2', key: 'yn7j0q' }],
  ['path', { d: 'M4 22V2', key: 'tsjzd3' }],
  ['path', { d: 'M20 22V2', key: '1bnhr8' }],
])

export const AlignHorizontalSpaceBetween = createLucideIcon('align-horizontal-space-between', [
  ['rect', { width: '6', height: '14', x: '3', y: '5', rx: '2', key: 'j77dae' }],
  ['rect', { width: '6', height: '10', x: '15', y: '7', rx: '2', key: 'bq30hj' }],
  ['path', { d: 'M3 2v20', key: '1d2pfg' }],
  ['path', { d: 'M21 2v20', key: 'p059bm' }],
])

export const AlignJustify = createLucideIcon('align-justify', [
  ['path', { d: 'M3 5h18', key: '1u36vt' }],
  ['path', { d: 'M3 12h18', key: '1i2n21' }],
  ['path', { d: 'M3 19h18', key: 'awlh7x' }],
])

export const AlignLeft = createLucideIcon('align-left', [
  ['path', { d: 'M21 5H3', key: '1fi0y6' }],
  ['path', { d: 'M15 12H3', key: '6jk70r' }],
  ['path', { d: 'M17 19H3', key: 'z6ezky' }],
])

export const AlignRight = createLucideIcon('align-right', [
  ['path', { d: 'M21 5H3', key: '1fi0y6' }],
  ['path', { d: 'M21 12H9', key: 'dn1m92' }],
  ['path', { d: 'M21 19H7', key: '4cu937' }],
])

export const AlignStartVertical = createLucideIcon('align-start-vertical', [
  ['rect', { width: '9', height: '6', x: '6', y: '14', rx: '2', key: 'lpm2y7' }],
  ['rect', { width: '16', height: '6', x: '6', y: '4', rx: '2', key: 'rdj6ps' }],
  ['path', { d: 'M2 2v20', key: '1ivd8o' }],
])

export const ArrowDown = createLucideIcon('arrow-down', [
  ['path', { d: 'M12 5v14', key: 's699le' }],
  ['path', { d: 'm19 12-7 7-7-7', key: '1idqje' }],
])

export const Ban = createLucideIcon('ban', [
  ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
  ['path', { d: 'M4.929 4.929 19.07 19.071', key: '196cmz' }],
])

export const BetweenHorizontalStart = createLucideIcon('between-horizontal-start', [
  ['rect', { width: '13', height: '7', x: '8', y: '3', rx: '1', key: 'pkso9a' }],
  ['path', { d: 'm2 9 3 3-3 3', key: '1agib5' }],
  ['rect', { width: '13', height: '7', x: '8', y: '14', rx: '1', key: '1q5fc1' }],
])

export const BetweenVerticalEnd = createLucideIcon('between-vertical-end', [
  ['rect', { width: '7', height: '13', x: '3', y: '3', rx: '1', key: '1fdu0f' }],
  ['path', { d: 'm9 22 3-3 3 3', key: '17z65a' }],
  ['rect', { width: '7', height: '13', x: '14', y: '3', rx: '1', key: '1squn4' }],
])

export const Blend = createLucideIcon('blend', [
  ['circle', { cx: '9', cy: '9', r: '7', key: 'p2h5vp' }],
  ['circle', { cx: '15', cy: '15', r: '7', key: '19ennj' }],
])

export const Bold = createLucideIcon('bold', [
  [
    'path',
    {
      d: 'M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8',
      key: 'mg9rjx',
    },
  ],
])

export const Bot = createLucideIcon('bot', [
  ['path', { d: 'M12 8V4H8', key: 'hb8ula' }],
  ['rect', { width: '16', height: '12', x: '4', y: '8', rx: '2', key: 'enze0r' }],
  ['path', { d: 'M2 14h2', key: 'vft8re' }],
  ['path', { d: 'M20 14h2', key: '4cs60a' }],
  ['path', { d: 'M15 13v2', key: '1xurst' }],
  ['path', { d: 'M9 13v2', key: 'rq6x2g' }],
])

export const Brain = createLucideIcon('brain', [
  ['path', { d: 'M12 18V5', key: 'adv99a' }],
  ['path', { d: 'M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4', key: '1e3is1' }],
  ['path', { d: 'M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5', key: '1gqd8o' }],
  ['path', { d: 'M17.997 5.125a4 4 0 0 1 2.526 5.77', key: 'iwvgf7' }],
  ['path', { d: 'M18 18a4 4 0 0 0 2-7.464', key: 'efp6ie' }],
  ['path', { d: 'M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517', key: '1gq6am' }],
  ['path', { d: 'M6 18a4 4 0 0 1-2-7.464', key: 'k1g0md' }],
  ['path', { d: 'M6.003 5.125a4 4 0 0 0-2.526 5.77', key: 'q97ue3' }],
])

export const Check = createLucideIcon('check', [['path', { d: 'M20 6 9 17l-5-5', key: '1gmf2c' }]])

export const ChevronDown = createLucideIcon('chevron-down', [
  ['path', { d: 'm6 9 6 6 6-6', key: 'qrunsl' }],
])

export const ChevronLeft = createLucideIcon('chevron-left', [
  ['path', { d: 'm15 18-6-6 6-6', key: '1wnfg3' }],
])

export const ChevronRight = createLucideIcon('chevron-right', [
  ['path', { d: 'm9 18 6-6-6-6', key: 'mthhwq' }],
])

export const CircleDashed = createLucideIcon('circle-dashed', [
  ['path', { d: 'M10.1 2.182a10 10 0 0 1 3.8 0', key: '5ilxe3' }],
  ['path', { d: 'M13.9 21.818a10 10 0 0 1-3.8 0', key: '11zvb9' }],
  ['path', { d: 'M17.609 3.721a10 10 0 0 1 2.69 2.7', key: '1iw5b2' }],
  ['path', { d: 'M2.182 13.9a10 10 0 0 1 0-3.8', key: 'c0bmvh' }],
  ['path', { d: 'M20.279 17.609a10 10 0 0 1-2.7 2.69', key: '1ruxm7' }],
  ['path', { d: 'M21.818 10.1a10 10 0 0 1 0 3.8', key: 'qkgqxc' }],
  ['path', { d: 'M3.721 6.391a10 10 0 0 1 2.7-2.69', key: '1mcia2' }],
  ['path', { d: 'M6.391 20.279a10 10 0 0 1-2.69-2.7', key: '1fvljs' }],
])

export const Clock = createLucideIcon('clock', [
  ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
  ['path', { d: 'M12 6v6l4 2', key: 'mmk7yg' }],
])

export const Command = createLucideIcon('command', [
  [
    'path',
    {
      d: 'M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3',
      key: '11bfej',
    },
  ],
])

export const Component = createLucideIcon('component', [
  [
    'path',
    {
      d: 'M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z',
      key: '1uwlt4',
    },
  ],
  [
    'path',
    {
      d: 'M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z',
      key: '10291m',
    },
  ],
  [
    'path',
    {
      d: 'M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z',
      key: '1tqoq1',
    },
  ],
  [
    'path',
    {
      d: 'M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z',
      key: '1x6lto',
    },
  ],
])

export const Copy = createLucideIcon('copy', [
  [
    'rect',
    {
      width: '14',
      height: '14',
      x: '8',
      y: '8',
      rx: '2',
      ry: '2',
      key: '17jyea',
    },
  ],
  [
    'path',
    {
      d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2',
      key: 'zix9uf',
    },
  ],
])

export const CornerDownLeft = createLucideIcon('corner-down-left', [
  ['path', { d: 'M20 4v7a4 4 0 0 1-4 4H4', key: '6o5b7l' }],
  ['path', { d: 'm9 10-5 5 5 5', key: '1kshq7' }],
])

export const Eye = createLucideIcon('eye', [
  [
    'path',
    {
      d: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0',
      key: '1nclc0',
    },
  ],
  ['circle', { cx: '12', cy: '12', r: '3', key: '1v7zrd' }],
])

export const EyeOff = createLucideIcon('eye-off', [
  [
    'path',
    {
      d: 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49',
      key: 'ct8e1f',
    },
  ],
  ['path', { d: 'M14.084 14.158a3 3 0 0 1-4.242-4.242', key: '151rxh' }],
  [
    'path',
    {
      d: 'M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143',
      key: '13bj9a',
    },
  ],
  ['path', { d: 'm2 2 20 20', key: '1ooewy' }],
])

export const FilePenLine = createLucideIcon('file-pen-line', [
  [
    'path',
    {
      d: 'M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z',
      key: 'ukzhwg',
    },
  ],
  ['path', { d: 'M14.487 7.858A1 1 0 0 1 14 7V2', key: '1klhew' }],
  [
    'path',
    {
      d: 'M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516',
      key: 'rxaxab',
    },
  ],
  ['path', { d: 'M8 18h1', key: '13wk12' }],
])

export const Fingerprint = createLucideIcon('fingerprint', [
  ['path', { d: 'M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4', key: '1nerag' }],
  ['path', { d: 'M14 13.12c0 2.38 0 6.38-1 8.88', key: 'o46ks0' }],
  ['path', { d: 'M17.29 21.02c.12-.6.43-2.3.5-3.02', key: 'ptglia' }],
  ['path', { d: 'M2 12a10 10 0 0 1 18-6', key: 'ydlgp0' }],
  ['path', { d: 'M2 16h.01', key: '1gqxmh' }],
  ['path', { d: 'M21.8 16c.2-2 .131-5.354 0-6', key: 'drycrb' }],
  ['path', { d: 'M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2', key: '1tidbn' }],
  ['path', { d: 'M8.65 22c.21-.66.45-1.32.57-2', key: '13wd9y' }],
  ['path', { d: 'M9 6.8a6 6 0 0 1 9 5.2v2', key: '1fr1j5' }],
])

export const Folder = createLucideIcon('folder', [
  [
    'path',
    {
      d: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z',
      key: '1kt360',
    },
  ],
])

export const Hand = createLucideIcon('hand', [
  ['path', { d: 'M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2', key: '1fvzgz' }],
  ['path', { d: 'M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2', key: '1kc0my' }],
  ['path', { d: 'M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8', key: '10h0bg' }],
  [
    'path',
    {
      d: 'M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15',
      key: '1s1gnw',
    },
  ],
])

export const History = createLucideIcon('history', [
  ['path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', key: '1357e3' }],
  ['path', { d: 'M3 3v5h5', key: '1xhq8a' }],
  ['path', { d: 'M12 7v5l4 2', key: '1fdv2h' }],
])

export const Image = createLucideIcon('image', [
  [
    'rect',
    {
      width: '18',
      height: '18',
      x: '3',
      y: '3',
      rx: '2',
      ry: '2',
      key: '1m3agn',
    },
  ],
  ['circle', { cx: '9', cy: '9', r: '2', key: 'af1f0g' }],
  ['path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21', key: '1xmnt7' }],
])

export const Leaf = createLucideIcon('leaf', [
  [
    'path',
    {
      d: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z',
      key: 'nnexq3',
    },
  ],
  ['path', { d: 'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12', key: 'mt58a7' }],
])

export const Link2 = createLucideIcon('link-2', [
  ['path', { d: 'M9 17H7A5 5 0 0 1 7 7h2', key: '8i5ue5' }],
  ['path', { d: 'M15 7h2a5 5 0 1 1 0 10h-2', key: '1b9ql8' }],
  ['line', { x1: '8', x2: '16', y1: '12', y2: '12', key: '1jonct' }],
])

export const LoaderCircle = createLucideIcon('loader-circle', [
  ['path', { d: 'M21 12a9 9 0 1 1-6.219-8.56', key: '13zald' }],
])

export const Lock = createLucideIcon('lock', [
  [
    'rect',
    {
      width: '18',
      height: '11',
      x: '3',
      y: '11',
      rx: '2',
      ry: '2',
      key: '1w4ew1',
    },
  ],
  ['path', { d: 'M7 11V7a5 5 0 0 1 10 0v4', key: 'fwvmzm' }],
])

export const LockOpen = createLucideIcon('lock-open', [
  [
    'rect',
    {
      width: '18',
      height: '11',
      x: '3',
      y: '11',
      rx: '2',
      ry: '2',
      key: '1w4ew1',
    },
  ],
  ['path', { d: 'M7 11V7a5 5 0 0 1 9.9-1', key: '1mm8w8' }],
])

export const MessageCircle = createLucideIcon('message-circle', [
  [
    'path',
    {
      d: 'M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719',
      key: '1sd12s',
    },
  ],
])

export const MessageCircleQuestionMark = createLucideIcon('message-circle-question-mark', [
  [
    'path',
    {
      d: 'M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719',
      key: '1sd12s',
    },
  ],
  ['path', { d: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3', key: '1u773s' }],
  ['path', { d: 'M12 17h.01', key: 'p32p05' }],
])

export const Monitor = createLucideIcon('monitor', [
  ['rect', { width: '20', height: '14', x: '2', y: '3', rx: '2', key: '48i651' }],
  ['line', { x1: '8', x2: '16', y1: '21', y2: '21', key: '1svkeh' }],
  ['line', { x1: '12', x2: '12', y1: '17', y2: '21', key: 'vw1qmm' }],
])

export const Moon = createLucideIcon('moon', [
  [
    'path',
    {
      d: 'M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401',
      key: 'kfwtm',
    },
  ],
])

export const Move = createLucideIcon('move', [
  ['path', { d: 'M12 2v20', key: 't6zp3m' }],
  ['path', { d: 'm15 19-3 3-3-3', key: '11eu04' }],
  ['path', { d: 'm19 9 3 3-3 3', key: '1mg7y2' }],
  ['path', { d: 'M2 12h20', key: '9i4pu4' }],
  ['path', { d: 'm5 9-3 3 3 3', key: 'j64kie' }],
  ['path', { d: 'm9 5 3-3 3 3', key: 'l8vdw6' }],
])

export const MoveHorizontal = createLucideIcon('move-horizontal', [
  ['path', { d: 'm18 8 4 4-4 4', key: '1ak13k' }],
  ['path', { d: 'M2 12h20', key: '9i4pu4' }],
  ['path', { d: 'm6 8-4 4 4 4', key: '15zrgr' }],
])

export const MoveVertical = createLucideIcon('move-vertical', [
  ['path', { d: 'M12 2v20', key: 't6zp3m' }],
  ['path', { d: 'm8 18 4 4 4-4', key: 'bh5tu3' }],
  ['path', { d: 'm8 6 4-4 4 4', key: 'ybng9g' }],
])

export const OctagonAlert = createLucideIcon('octagon-alert', [
  ['path', { d: 'M12 16h.01', key: '1drbdi' }],
  ['path', { d: 'M12 8v4', key: '1got3b' }],
  [
    'path',
    {
      d: 'M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z',
      key: '1fd625',
    },
  ],
])

export const Palette = createLucideIcon('palette', [
  [
    'path',
    {
      d: 'M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z',
      key: 'e79jfc',
    },
  ],
  ['circle', { cx: '13.5', cy: '6.5', r: '.5', fill: 'currentColor', key: '1okk4w' }],
  ['circle', { cx: '17.5', cy: '10.5', r: '.5', fill: 'currentColor', key: 'f64h9f' }],
  ['circle', { cx: '6.5', cy: '12.5', r: '.5', fill: 'currentColor', key: 'qy21gx' }],
  ['circle', { cx: '8.5', cy: '7.5', r: '.5', fill: 'currentColor', key: 'fotxhn' }],
])

export const Pause = createLucideIcon('pause', [
  ['rect', { x: '14', y: '3', width: '5', height: '18', rx: '1', key: 'kaeet6' }],
  ['rect', { x: '5', y: '3', width: '5', height: '18', rx: '1', key: '1wsw3u' }],
])

export const PenLine = createLucideIcon('pen-line', [
  ['path', { d: 'M13 21h8', key: '1jsn5i' }],
  [
    'path',
    {
      d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
      key: '1a8usu',
    },
  ],
])

export const Plug = createLucideIcon('plug', [
  ['path', { d: 'M12 22v-5', key: '1ega77' }],
  ['path', { d: 'M15 8V2', key: '18g5xt' }],
  [
    'path',
    {
      d: 'M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z',
      key: '1xoxul',
    },
  ],
  ['path', { d: 'M9 8V2', key: '14iosj' }],
])

export const RefreshCw = createLucideIcon('refresh-cw', [
  ['path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8', key: 'v9h5vc' }],
  ['path', { d: 'M21 3v5h-5', key: '1q7to0' }],
  ['path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16', key: '3uifl3' }],
  ['path', { d: 'M8 16H3v5', key: '1cv678' }],
])

export const Reply = createLucideIcon('reply', [
  ['path', { d: 'M20 18v-2a4 4 0 0 0-4-4H4', key: '5vmcpk' }],
  ['path', { d: 'm9 17-5-5 5-5', key: 'nvlc11' }],
])

export const RotateCcw = createLucideIcon('rotate-ccw', [
  ['path', { d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', key: '1357e3' }],
  ['path', { d: 'M3 3v5h5', key: '1xhq8a' }],
])

export const RotateCw = createLucideIcon('rotate-cw', [
  ['path', { d: 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8', key: '1p45f6' }],
  ['path', { d: 'M21 3v5h-5', key: '1q7to0' }],
])

export const Scaling = createLucideIcon('scaling', [
  [
    'path',
    {
      d: 'M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7',
      key: '1m0v6g',
    },
  ],
  ['path', { d: 'M14 15H9v-5', key: 'pi4jk9' }],
  ['path', { d: 'M16 3h5v5', key: '1806ms' }],
  ['path', { d: 'M21 3 9 15', key: '15kdhq' }],
])

export const Search = createLucideIcon('search', [
  ['path', { d: 'm21 21-4.34-4.34', key: '14j7rj' }],
  ['circle', { cx: '11', cy: '11', r: '8', key: '4ej97u' }],
])

export const Send = createLucideIcon('send', [
  [
    'path',
    {
      d: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z',
      key: '1ffxy3',
    },
  ],
  ['path', { d: 'm21.854 2.147-10.94 10.939', key: '12cjpa' }],
])

export const SendHorizontal = createLucideIcon('send-horizontal', [
  [
    'path',
    {
      d: 'M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z',
      key: '117uat',
    },
  ],
  ['path', { d: 'M6 12h16', key: 's4cdu5' }],
])

export const Signal = createLucideIcon('signal', [
  ['path', { d: 'M2 20h.01', key: '4haj6o' }],
  ['path', { d: 'M7 20v-4', key: 'j294jx' }],
  ['path', { d: 'M12 20v-8', key: 'i3yub9' }],
  ['path', { d: 'M17 20V8', key: '1tkaf5' }],
  ['path', { d: 'M22 4v16', key: 'sih9yq' }],
])

export const SignalHigh = createLucideIcon('signal-high', [
  ['path', { d: 'M2 20h.01', key: '4haj6o' }],
  ['path', { d: 'M7 20v-4', key: 'j294jx' }],
  ['path', { d: 'M12 20v-8', key: 'i3yub9' }],
  ['path', { d: 'M17 20V8', key: '1tkaf5' }],
])

export const SignalLow = createLucideIcon('signal-low', [
  ['path', { d: 'M2 20h.01', key: '4haj6o' }],
  ['path', { d: 'M7 20v-4', key: 'j294jx' }],
])

export const SignalMedium = createLucideIcon('signal-medium', [
  ['path', { d: 'M2 20h.01', key: '4haj6o' }],
  ['path', { d: 'M7 20v-4', key: 'j294jx' }],
  ['path', { d: 'M12 20v-8', key: 'i3yub9' }],
])

export const SignalZero = createLucideIcon('signal-zero', [
  ['path', { d: 'M2 20h.01', key: '4haj6o' }],
])

export const SlidersHorizontal = createLucideIcon('sliders-horizontal', [
  ['path', { d: 'M10 5H3', key: '1qgfaw' }],
  ['path', { d: 'M12 19H3', key: 'yhmn1j' }],
  ['path', { d: 'M14 3v4', key: '1sua03' }],
  ['path', { d: 'M16 17v4', key: '1q0r14' }],
  ['path', { d: 'M21 12h-9', key: '1o4lsq' }],
  ['path', { d: 'M21 19h-5', key: '1rlt1p' }],
  ['path', { d: 'M21 5h-7', key: '1oszz2' }],
  ['path', { d: 'M8 10v4', key: 'tgpxqk' }],
  ['path', { d: 'M8 12H3', key: 'a7s4jb' }],
])

export const SquareMousePointer = createLucideIcon('square-mouse-pointer', [
  [
    'path',
    {
      d: 'M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z',
      key: 'xwnzip',
    },
  ],
  [
    'path',
    {
      d: 'M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6',
      key: '14rsvq',
    },
  ],
])

export const StretchHorizontal = createLucideIcon('stretch-horizontal', [
  ['rect', { width: '20', height: '6', x: '2', y: '4', rx: '2', key: 'qdearl' }],
  ['rect', { width: '20', height: '6', x: '2', y: '14', rx: '2', key: '1xrn6j' }],
])

export const Sun = createLucideIcon('sun', [
  ['circle', { cx: '12', cy: '12', r: '4', key: '4exip2' }],
  ['path', { d: 'M12 2v2', key: 'tus03m' }],
  ['path', { d: 'M12 20v2', key: '1lh1kg' }],
  ['path', { d: 'm4.93 4.93 1.41 1.41', key: '149t6j' }],
  ['path', { d: 'm17.66 17.66 1.41 1.41', key: 'ptbguv' }],
  ['path', { d: 'M2 12h2', key: '1t8f8n' }],
  ['path', { d: 'M20 12h2', key: '1q8mjw' }],
  ['path', { d: 'm6.34 17.66-1.41 1.41', key: '1m8zz5' }],
  ['path', { d: 'm19.07 4.93-1.41 1.41', key: '1shlcs' }],
])

export const Terminal = createLucideIcon('terminal', [
  ['path', { d: 'M12 19h8', key: 'baeox8' }],
  ['path', { d: 'm4 17 6-6-6-6', key: '1yngyt' }],
])

export const Trash2 = createLucideIcon('trash-2', [
  ['path', { d: 'M10 11v6', key: 'nco0om' }],
  ['path', { d: 'M14 11v6', key: 'outv1u' }],
  ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', key: 'miytrc' }],
  ['path', { d: 'M3 6h18', key: 'd0wm0j' }],
  ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', key: 'e791ji' }],
])

export const TriangleAlert = createLucideIcon('triangle-alert', [
  [
    'path',
    {
      d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3',
      key: 'wmoenq',
    },
  ],
  ['path', { d: 'M12 9v4', key: 'juzpu7' }],
  ['path', { d: 'M12 17h.01', key: 'p32p05' }],
])

export const UserPlus = createLucideIcon('user-plus', [
  ['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', key: '1yyitq' }],
  ['circle', { cx: '9', cy: '7', r: '4', key: 'nufk8' }],
  ['line', { x1: '19', x2: '19', y1: '8', y2: '14', key: '1bvyxn' }],
  ['line', { x1: '22', x2: '16', y1: '11', y2: '11', key: '1shjgl' }],
])

export const X = createLucideIcon('x', [
  ['path', { d: 'M18 6 6 18', key: '1bl5f8' }],
  ['path', { d: 'm6 6 12 12', key: 'd8bk6v' }],
])

export const Zap = createLucideIcon('zap', [
  [
    'path',
    {
      d: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
      key: '1xq2db',
    },
  ],
])
