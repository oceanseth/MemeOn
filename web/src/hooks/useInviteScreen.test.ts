import { describe, expect, it } from 'vitest'
import { inviteAcceptPayload } from './useInviteScreen'

describe('invite acceptance', () => {
  it('uses the current inviter identity for its submission payload', () => {
    expect(inviteAcceptPayload('inviter-a')).toEqual({ inviterId: 'inviter-a' })
    expect(inviteAcceptPayload('inviter-b')).toEqual({ inviterId: 'inviter-b' })
  })
})
