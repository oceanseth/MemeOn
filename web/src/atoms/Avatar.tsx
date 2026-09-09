import { Avatar as BaseAvatar } from '@base-ui/react/avatar'
import { avatarInitial } from '../lib/avatarModel'
import { cn } from '../lib/cn'

/** `sm` is the 32px `.avatar` disc; `lg` is the 96px `.profile-avatar` / `.invite-avatar` identity ring. */
export type AvatarSize = 'sm' | 'lg'

const rootChrome: Record<AvatarSize, string> = {
  sm: 'size-8 border border-border bg-bg-card',
  lg: 'size-24 border-[3px] border-accent bg-bg-raised',
}

const fallbackChrome: Record<AvatarSize, string> = {
  sm: 'text-[15px] font-bold text-text-dim',
  lg: 'text-[40px] leading-none font-extrabold text-text',
}

export function Avatar({
  name,
  src,
  alt = '',
  size = 'sm',
  className,
}: {
  name: string
  src?: string | null | undefined
  alt?: string | undefined
  size?: AvatarSize | undefined
  className?: string | undefined
}) {
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
        // Google avatar URLs answer 403 to a request that carries a referrer
        <BaseAvatar.Image
          src={src}
          alt={alt}
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
