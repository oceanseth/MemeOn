import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
import type { ComponentPropsWithoutRef } from 'react'
import { avatarInitial } from '../lib/avatarModel'
import { cn } from '../lib/cn'

/** `sm` 32 · `header` 34 · `md` 40 · `lg` 56 · `hero` 86/74 · `public` 60. */
export type AvatarSize = 'sm' | 'header' | 'md' | 'lg' | 'hero' | 'public'

const rootChrome: Record<AvatarSize, string> = {
  sm: 'size-8',
  header: 'size-control-sm rounded-control-sm', // tighter radius at the small disc
  md: 'size-10',
  lg: 'size-14',
  hero: 'size-avatar-hero rounded-avatar-hero max-sm:size-avatar-hero-phone max-sm:rounded-band',
  public: 'size-15 rounded-[22px]',
}

const fallbackChrome: Record<AvatarSize, string> = {
  sm: 'text-label',
  header: 'text-caption',
  md: 'text-label',
  lg: 'text-card-title leading-none',
  hero: 'text-title leading-none max-sm:text-card-title',
  public: 'text-card-title leading-none',
}

/** Unlisted img props (e.g. `loading="lazy"`) pass through to the image. */
export type AvatarProps = Omit<ComponentPropsWithoutRef<'img'>, 'src' | 'className'> & {
  name: string
  src?: string | null | undefined
  size?: AvatarSize | undefined
  className?: string | undefined
}

export function Avatar({ name, src, alt = '', size = 'sm', className, ...imgProps }: AvatarProps) {
  return (
    <BaseAvatar.Root
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden select-none',
        'rounded-avatar border-0 bg-action-secondary shadow-raised',
        rootChrome[size],
        className,
      )}
      data-slot="avatar"
    >
      {src ? (
        <BaseAvatar.Image
          {...imgProps}
          src={src}
          alt={alt}
          referrerPolicy="no-referrer" // Google avatars 403 with a referrer
          className="size-full object-cover"
        />
      ) : null}
      <BaseAvatar.Fallback
        aria-hidden="true"
        className={cn(
          'flex size-full items-center justify-center font-semibold text-on-action-secondary',
          fallbackChrome[size],
        )}
      >
        {avatarInitial(name)}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  )
}
