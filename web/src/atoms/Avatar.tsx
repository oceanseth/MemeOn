import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
import type { ComponentPropsWithoutRef } from 'react'
import { avatarInitial } from '../lib/avatarModel'
import { cn } from '../lib/cn'

/**
 * `sm` is the 32px topbar squircle, `md` the 40px identity/people-row one (the app's most common,
 * and the size the sidebar and header draw), `lg` the 56px profile and invite one.
 */
export type AvatarSize = 'sm' | 'md' | 'lg'

/** Not a circle: `--radius-avatar` is 15px, which is what makes the boards' squircle read. */
const rootChrome: Record<AvatarSize, string> = {
  sm: 'size-8',
  md: 'size-10',
  lg: 'size-14',
}

/** One monogram size for the two small discs; only `lg` scales it up. */
const fallbackChrome: Record<AvatarSize, string> = {
  sm: 'text-label',
  md: 'text-label',
  lg: 'text-[22px] leading-none',
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
          // last word: Google avatar URLs answer 403 to a request that carries a referrer
          referrerPolicy="no-referrer"
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
