import { cn } from '../lib/cn'

/**
 * The Central icon family, extracted from Paper ("MemeOn — Soft Press / Interface Atlas",
 * DS 04 · Icon families and navigation, plus every board it recurs on). Every name below is a
 * glyph that is actually drawn somewhere in the design — nothing here is invented. Sidebar/header
 * glyphs that stay emoji in the design (🔔 alerts, 🌗☀️🌙 theme, 🔧 developers) get no Icon.
 */
export type IconName =
  | 'storefront'
  | 'book'
  | 'users'
  | 'arrows-left-right'
  | 'trophy'
  | 'gear'
  | 'magnifying-glass'
  | 'circle-plus'
  | 'bell'
  | 'arrow-right'
  | 'sun'
  | 'moon'

export const ICON_NAMES: readonly IconName[] = [
  'storefront',
  'book',
  'users',
  'arrows-left-right',
  'trophy',
  'gear',
  'magnifying-glass',
  'circle-plus',
  'bell',
  'arrow-right',
  'sun',
  'moon',
]

interface PathDef {
  d: string
  linecap?: 'round'
  linejoin?: 'round'
}

const PATHS: Record<IconName, readonly PathDef[]> = {
  storefront: [
    {
      d: 'M20.25 11.409V18.25C20.25 19.355 19.355 20.25 18.25 20.25H5.75C4.645 20.25 3.75 19.355 3.75 18.25V11.409',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M9.5 3.75H14.5M9.5 3.75L8.909 8.774C8.692 10.624 10.137 12.25 12 12.25C13.863 12.25 15.309 10.624 15.091 8.774L14.5 3.75M9.5 3.75H5.886C5.012 3.75 4.239 4.317 3.977 5.151L2.973 8.354C2.367 10.285 3.809 12.25 5.834 12.25C7.354 12.25 8.634 11.112 8.812 9.602L9.5 3.75ZM14.5 3.75H18.115C18.989 3.75 19.762 4.317 20.023 5.151L21.028 8.354C21.634 10.285 20.191 12.25 18.167 12.25C16.646 12.25 15.366 11.112 15.189 9.602L14.5 3.75Z',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  book: [
    {
      d: 'M10.625 7.177L10.855 4.989C10.97 3.891 11.955 3.094 13.053 3.209L19.02 3.836C20.119 3.952 20.916 4.936 20.8 6.034L19.86 14.985C19.744 16.084 18.76 16.881 17.661 16.765L14.002 16.38',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M3.162 10.034C3.047 8.936 3.844 7.952 4.942 7.836L10.909 7.209C12.008 7.094 12.992 7.891 13.107 8.989L14.048 17.94C14.164 19.038 13.367 20.022 12.268 20.138L6.301 20.765C5.203 20.881 4.218 20.084 4.103 18.985L3.162 10.034Z',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  users: [
    {
      d: 'M9.25 9.75C7.317 9.75 5.75 8.183 5.75 6.25C5.75 4.317 7.317 2.75 9.25 2.75C11.183 2.75 12.75 4.317 12.75 6.25C12.75 8.183 11.183 9.75 9.25 9.75Z',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M15 2.75C16.933 2.75 18.5 4.317 18.5 6.25C18.5 8.183 16.933 9.75 15 9.75',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M9.248 12.75C5.464 12.75 2.275 15.152 1.303 18.25C0.972 19.303 1.893 20.219 2.998 20.219H15.498C16.603 20.219 17.524 19.303 17.194 18.25C16.221 15.152 13.032 12.75 9.248 12.75Z',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M20.75 20.25H21.25C22.355 20.25 23.275 19.335 22.941 18.282C22.26 16.139 20.512 14.31 18.25 13.509',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  'arrows-left-right': [
    { d: 'M17.5 2.75L19.97 5.22C20.263 5.513 20.263 5.987 19.97 6.28L17.5 8.75', linecap: 'round', linejoin: 'round' },
    { d: 'M6.5 21.25L4.03 18.78C3.737 18.487 3.737 18.013 4.03 17.72L6.5 15.25', linecap: 'round', linejoin: 'round' },
    { d: 'M5.25 18.25H18.25C19.355 18.25 20.25 17.355 20.25 16.25V13.25', linecap: 'round', linejoin: 'round' },
    { d: 'M3.75 10.25V7.75C3.75 6.645 4.645 5.75 5.75 5.75H18.75', linecap: 'round', linejoin: 'round' },
  ],
  trophy: [
    { d: 'M12 18V15', linejoin: 'round' },
    {
      d: 'M18.25 4.75H19.25C20.355 4.75 21.25 5.645 21.25 6.75V7.25C21.25 8.907 19.907 10.25 18.25 10.25',
      linejoin: 'round',
    },
    {
      d: 'M5.75 4.75C5.75 3.645 6.645 2.75 7.75 2.75H16.25C17.355 2.75 18.25 3.645 18.25 4.75V9.25C18.25 12.564 15.564 15.25 12.25 15.25H11.75C8.436 15.25 5.75 12.564 5.75 9.25V4.75Z',
      linejoin: 'round',
    },
    {
      d: 'M6.75 19.25C6.75 18.422 7.422 17.75 8.25 17.75H15.75C16.578 17.75 17.25 18.422 17.25 19.25V19.75C17.25 20.578 16.578 21.25 15.75 21.25H8.25C7.422 21.25 6.75 20.578 6.75 19.75V19.25Z',
      linejoin: 'round',
    },
    {
      d: 'M5.75 4.75H4.75C3.645 4.75 2.75 5.645 2.75 6.75V7.25C2.75 8.907 4.093 10.25 5.75 10.25',
      linejoin: 'round',
    },
  ],
  gear: [
    {
      d: 'M7.878 5.214L7.175 5.052C6.58 4.915 5.957 5.093 5.525 5.525C5.093 5.957 4.915 6.58 5.052 7.175L5.214 7.878C5.401 8.689 5.067 9.53 4.375 9.992L3.52 10.562C3.039 10.883 2.75 11.422 2.75 12C2.75 12.578 3.039 13.117 3.52 13.438L4.375 14.008C5.067 14.47 5.401 15.311 5.214 16.122L5.052 16.825C4.915 17.42 5.093 18.043 5.525 18.475C5.957 18.907 6.58 19.085 7.175 18.948L7.878 18.786C8.689 18.599 9.53 18.933 9.992 19.625L10.562 20.48C10.883 20.961 11.422 21.25 12 21.25C12.578 21.25 13.117 20.961 13.438 20.48L14.008 19.625C14.47 18.933 15.311 18.599 16.122 18.786L16.825 18.948C17.42 19.085 18.043 18.907 18.475 18.475C18.907 18.043 19.085 17.42 18.948 16.825L18.786 16.122C18.599 15.311 18.933 14.47 19.625 14.008L20.48 13.438C20.961 13.117 21.25 12.578 21.25 12C21.25 11.422 20.961 10.883 20.48 10.562L19.625 9.992C18.933 9.53 18.599 8.689 18.786 7.878L18.948 7.175C19.085 6.58 18.907 5.957 18.475 5.525C18.043 5.093 17.42 4.915 16.825 5.052L16.122 5.214C15.311 5.401 14.47 5.067 14.008 4.375L13.438 3.52C13.117 3.039 12.578 2.75 12 2.75C11.422 2.75 10.883 3.039 10.562 3.52L9.992 4.375C9.53 5.067 8.689 5.401 7.878 5.214Z',
      linejoin: 'round',
    },
    {
      d: 'M14.75 12C14.75 13.519 13.519 14.75 12 14.75C10.481 14.75 9.25 13.519 9.25 12C9.25 10.481 10.481 9.25 12 9.25C13.519 9.25 14.75 10.481 14.75 12Z',
      linejoin: 'round',
    },
  ],
  'magnifying-glass': [
    {
      d: 'M20.25 20.25L16.127 16.127M16.127 16.127C17.439 14.815 18.25 13.002 18.25 11C18.25 6.996 15.004 3.75 11 3.75C6.996 3.75 3.75 6.996 3.75 11C3.75 15.004 6.996 18.25 11 18.25C13.002 18.25 14.815 17.439 16.127 16.127Z',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  'circle-plus': [
    {
      d: 'M16.243 12.001H7.757M12 16.243V7.758M21.25 12C21.25 17.109 17.109 21.25 12 21.25C6.891 21.25 2.75 17.109 2.75 12C2.75 6.891 6.891 2.75 12 2.75C17.109 2.75 21.25 6.891 21.25 12Z',
      linecap: 'round',
    },
  ],
  bell: [
    {
      d: 'M4.473 9.402C4.943 5.603 8.172 2.75 12 2.75C15.828 2.75 19.057 5.603 19.527 9.402L20.222 15.004C20.369 16.197 19.439 17.25 18.237 17.25H5.763C4.561 17.25 3.631 16.197 3.778 15.004L4.473 9.402Z',
      linecap: 'round',
      linejoin: 'round',
    },
    {
      d: 'M16 17.25C16 19.459 14.209 21.25 12 21.25C9.791 21.25 8 19.459 8 17.25',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  'arrow-right': [
    { d: 'M14 5.75L20.25 12L14 18.25', linecap: 'round', linejoin: 'round' },
    { d: 'M19.5 12H3.75', linecap: 'round', linejoin: 'round' },
  ],
  sun: [
    {
      d: 'M11.998 3.291V1.768M5.84 18.159L4.763 19.236M11.998 22.233V20.709M19.233 4.765L18.156 5.842M20.707 12H22.23M18.156 18.159L19.233 19.236M1.766 12H3.289M4.763 4.765L5.84 5.842M15.71 8.288C17.761 10.338 17.761 13.662 15.71 15.712C13.66 17.763 10.336 17.763 8.286 15.712C6.235 13.662 6.235 10.338 8.286 8.288C10.336 6.238 13.66 6.238 15.71 8.288Z',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
  moon: [
    {
      d: 'M21.248 11.811C20.189 12.56 18.896 13 17.5 13C13.91 13 11 10.09 11 6.5C11 5.104 11.44 3.811 12.189 2.752C12.126 2.751 12.063 2.75 12 2.75C6.891 2.75 2.75 6.891 2.75 12C2.75 17.109 6.891 21.25 12 21.25C17.109 21.25 21.25 17.109 21.25 12C21.25 11.937 21.249 11.874 21.248 11.811Z',
      linecap: 'round',
      linejoin: 'round',
    },
  ],
}

export interface IconProps {
  name: IconName
  size?: number
  className?: string
  title?: string
}

/**
 * The Central icon glyph, the only drawn icon family the app uses (Phosphor is out). Every
 * emoji stays an emoji — this atom never substitutes for one.
 */
export function Icon({ name, size = 22, className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      data-slot="icon"
      className={cn('inline-block shrink-0', className)}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name].map((path, index) => (
        <path key={index} d={path.d} fill="none" strokeLinecap={path.linecap} strokeLinejoin={path.linejoin} />
      ))}
    </svg>
  )
}
