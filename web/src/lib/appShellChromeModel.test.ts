import { describe, expect, it } from 'vitest'
import { appShellCopy } from '../copy/appShell'
import { sharedCopy } from '../copy/shared'
import { buildAppShellChrome } from './appShellChromeModel'

describe('buildAppShellChrome', () => {
  it('reads skip, brand, landmarks, and footer labels from copy', () => {
    const chrome = buildAppShellChrome()
    expect(chrome.skipLabel).toBe(appShellCopy.skip)
    expect(chrome.brand).toBe(sharedCopy.brand)
    expect(chrome.navAria).toBe(appShellCopy.navAria)
    expect(chrome.footerAria).toBe(appShellCopy.footerAria)
    expect(chrome.footer.privacy).toBe(appShellCopy.footer.privacy)
    expect(chrome.footer.terms).toBe(appShellCopy.footer.terms)
    expect(chrome.footer.developers).toBe(appShellCopy.accountMenu.developers)
    expect(chrome.footer.discord).toBe(appShellCopy.accountMenu.discord)
    expect(chrome.footer.api).toBe(appShellCopy.footer.api)
  })
})
