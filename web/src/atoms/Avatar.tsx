import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
import type { ComponentPropsWithoutRef } from 'react'
import { avatarInitial } from '../lib/avatarModel'
import { cn } from '../lib/cn'

/**
 * `sm` is the 32px topbar disc, `md` the 40px people-row disc (the app's most common one),
 * `lg` the 96px identity ring on a profile or an invite.
 */
export type AvatarSize = 'sm' | 'md' | 'lg'

const rootChrome: Record<AvatarSize, string> = {
  sm: 'size-8 border border-border bg-bg-card',
  md: 'size-10 border border-border bg-bg-card',
  lg: 'size-24 border-[3px] border-accent bg-bg-raised',
}

/** One monogram size for both disc sizes; only the ring scales up with `lg`. */
const fallbackChrome: Record<AvatarSize, string> = {
  sm: 'text-[15px] font-bold text-text-dim',
  md: 'text-[15px] font-bold text-text-dim',
  lg: 'text-[40px] leading-none font-extrabold text-text',
}

/** Everything not named here lands on the `<img>`, so a list model's `loading="lazy"` survives. */
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
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full select-none',
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
          // last word: Google avatar URLs answer 403 to a request that carries a referrer
          referrerPolicy="no-referrer"
          className="size-full object-cover"
        />
      ) : null}
      <BaseAvatar.Fallback
        aria-hidden="true"
        className={cn('flex size-full items-center justify-center', fallbackChrome[size])}
      >
        {avatarInitial(name)}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  )
}
