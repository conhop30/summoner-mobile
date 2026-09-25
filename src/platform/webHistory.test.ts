// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { backDepth, pushBackHandler } from './backStack'
import { installWebHistory } from './webHistory'

// jsdom delivers popstate asynchronously after history.back().
const settle = () => new Promise(r => setTimeout(r, 80))

let uninstall: () => void
beforeEach(() => {
  history.replaceState({ usr: null, key: 'root', idx: 0 }, '', '/')
  uninstall = installWebHistory()
})
afterEach(() => uninstall())

// Stands in for a sheet: open = register a handler, close = run its cleanup.
function openSheet() {
  let release: () => void = () => {}
  const sheet = { closed: false, close: () => { sheet.closed = true; release() } }
  release = pushBackHandler(() => sheet.close())
  return sheet
}

describe('web history', () => {
  it('Back closes the open sheet and stays on the screen', async () => {
    const sheet = openSheet()
    history.back()
    await settle()
    expect(sheet.closed).toBe(true)
    expect(backDepth()).toBe(0)
    expect(history.state).toMatchObject({ key: 'root' })
    // Closing by Back must not have popped a second entry.
    expect(history.state).not.toHaveProperty('__sheet')
  })

  it('dismissing a sheet removes its entry so Back still means "go up a screen"', async () => {
    const sheet = openSheet()
    sheet.close()
    await settle()
    expect(history.state).toMatchObject({ key: 'root' })
    expect(history.state).not.toHaveProperty('__sheet')
  })

  it('a sheet swapped for another in the same tick (More → About) keeps one entry, and Back closes the new one', async () => {
    const push = vi.spyOn(history, 'pushState')
    const back = vi.spyOn(history, 'back')
    const menu = openSheet()
    menu.close()
    const about = openSheet() // same tick: takes over the menu's entry
    await settle()
    expect(push).toHaveBeenCalledTimes(1)
    expect(back).not.toHaveBeenCalled()
    expect(history.state).toHaveProperty('__sheet', true)
    back.mockRestore()
    push.mockRestore()
    history.back()
    await settle()
    expect(about.closed).toBe(true)
    expect(history.state).toMatchObject({ key: 'root' })
  })

  it('Back closes stacked sheets one at a time, top first', async () => {
    const lower = openSheet()
    const upper = openSheet()
    history.back()
    await settle()
    expect(upper.closed).toBe(true)
    expect(lower.closed).toBe(false)
    history.back()
    await settle()
    expect(lower.closed).toBe(true)
    expect(history.state).toMatchObject({ key: 'root' })
  })

  it('a sheet that closes after the app navigated does not undo the navigation', async () => {
    const sheet = openSheet()
    // The app moves to a new screen (as the router would), then the sheet closes.
    history.pushState({ usr: null, key: 'champion', idx: 1 }, '', '/c/1')
    sheet.close()
    await settle()
    expect(location.pathname).toBe('/c/1')
    expect(history.state).toMatchObject({ key: 'champion' })
  })

  it('Back from the new screen skips the entry the sheet left behind', async () => {
    const sheet = openSheet()
    history.pushState({ usr: null, key: 'champion', idx: 1 }, '', '/c/1')
    sheet.close()
    await settle()
    history.back()
    await settle()
    // Landed on the leftover sheet entry, then went on to the screen underneath it.
    expect(history.state).toMatchObject({ key: 'root' })
    expect(location.pathname).toBe('/')
  })
})
