import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'
import { avatarInitial } from '../lib/avatarModel'
import { cn } from '@/lib/cn'

/**
 * The identity disc. `sm` 32 · `header` 34 · `rank` 36 · `md` 40 · `podium` 50/36 · `lg` 56 ·
 * `public` 60 · `hero` 86/74; the radius rides the size, tighter under 40px, a card's at 56 and
 * above. `rank` and `podium` are the leaderboard's two, the second shrinking to `rank` on the
 * phone.
 */
const avatarVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden select-none rounded-md material-raised bg-brand',
  {
    variants: {
      size: {
        sm: 'size-8',
        header: 'size-8.5 rounded-sm',
        rank: 'size-9 rounded-sm',
        md: 'size-10',
        podium: 'size-12.5 max-md:size-9 max-md:rounded-sm',
        lg: 'size-14 rounded-lg',
        public: 'size-15 rounded-lg',
        hero: 'size-21.5 rounded-xl max-sm:size-18.5',
      },
    },
    defaultVariants: { size: 'sm' },
  },
)

/** The monogram's type step per disc; pass the same size the disc was given. */
const avatarFallbackVariants = cva(
  'flex size-full items-center justify-center font-semibold text-brand-foreground',
  {
    variants: {
      size: {
        sm: 'text-base',
        header: 'text-sm',
        rank: 'text-sm',
        md: 'text-base',
        podium: 'text-2xl leading-none max-md:text-sm',
        lg: 'text-2xl leading-none',
        public: 'text-2xl leading-none',
        hero: 'text-3xl leading-none max-sm:text-2xl',
      },
    },
    defaultVariants: { size: 'sm' },
  },
)

export type AvatarSize = NonNullable<VariantProps<typeof avatarVariants>['size']>

export interface AvatarProps extends Omit<AvatarPrimitive.Root.Props, 'className' | 'children'> {
  size?: AvatarSize | null | undefined
  className?: string | undefined
  /** The monogram's source; with `src`, `alt` and `loading` the root composes its own parts. */
  name?: string | undefined
  src?: string | null | undefined
  alt?: string | undefined
  loading?: 'lazy' | 'eager' | undefined
  /** Composed form: `<AvatarImage>` and `<AvatarFallback>` supplied by the caller. */
  children?: ReactNode
}

/**
 * Given `name`/`src` it renders its own image and monogram (the app's models carry both); given
 * children it is the registry root and the parts below do the rest.
 */
export function Avatar({
  name = '',
  src,
  alt = '',
  loading,
  size,
  className,
  children,
  ...props
}: AvatarProps) {
  const resolved = size ?? 'sm'
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={resolved}
      className={cn(avatarVariants({ size: resolved }), className)}
      {...props}
    >
      {children ?? (
        <>
          {src ? <AvatarImage src={src} alt={alt} loading={loading} /> : null}
          <AvatarFallback size={resolved}>{avatarInitial(name)}</AvatarFallback>
        </>
      )}
    </AvatarPrimitive.Root>
  )
}

export interface AvatarImageProps extends Omit<AvatarPrimitive.Image.Props, 'className'> {
  className?: string | undefined
}

/** Google avatars 403 with a referrer, so none is sent unless the caller says otherwise. */
export function AvatarImage({ className, ...props }: AvatarImageProps) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      referrerPolicy="no-referrer"
      className={cn('size-full object-cover', className)}
      {...props}
    />
  )
}

export interface AvatarFallbackProps extends Omit<AvatarPrimitive.Fallback.Props, 'className'> {
  className?: string | undefined
  size?: AvatarSize | undefined
}

/** The monogram, at the size it is given; decorative, the name sits in text beside it. */
export function AvatarFallback({ className, size = 'sm', ...props }: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      aria-hidden="true"
      className={cn(avatarFallbackVariants({ size }), className)}
      {...props}
    />
  )
}

export { avatarVariants, avatarFallbackVariants }
