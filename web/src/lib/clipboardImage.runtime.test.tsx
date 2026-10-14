import { describe, expect, it } from 'vitest'
import { takesTextPaste } from './clipboardImage'

/* `takesTextPaste` is instanceof checks over real DOM classes, so it is pinned on the runtime
   project; the permission and reader seams stay on the unit project in `clipboardImage.test.ts`. */
describe('takesTextPaste', () => {
  it('knows which paste targets keep their text paste', () => {
    expect(takesTextPaste(document.createElement('input'))).toBe(true)
    expect(takesTextPaste(document.createElement('textarea'))).toBe(true)
    expect(takesTextPaste(document.createElement('div'))).toBe(false)
    expect(takesTextPaste(null)).toBe(false)
    expect(takesTextPaste(document.body)).toBe(false)

    const editable = document.createElement('div')
    editable.contentEditable = 'true'
    document.body.append(editable)
    try {
      expect(takesTextPaste(editable)).toBe(true)
    } finally {
      editable.remove()
    }
  })
})
