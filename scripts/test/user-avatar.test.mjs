/**
 * The avatar's three states: photograph, initials, glyph.
 *
 * The initials half is a pure function and is tested as one. The rendering
 * half is asserted structurally — the component is a client component and
 * there is no DOM renderer in this suite — so what is checked here is that the
 * three branches exist and that the failure path is wired, which is the part
 * that was missing before: an `avatarUrl` that fails to load used to leave the
 * browser drawing its own broken-image icon inside a 32px circle.
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { initialsFor } from '../../lib/auth/initials.ts'

const root = fileURLToPath(new URL('../../', import.meta.url))
const source = readFileSync(root + 'components/layout/user-avatar.tsx', 'utf8')

describe('initials', () => {
  test('a full name gives two initials', () => {
    assert.equal(initialsFor({ name: 'Dhairya Narang', email: null }), 'DN')
  })

  test('a single name gives one', () => {
    assert.equal(initialsFor({ name: 'Dhairya', email: null }), 'D')
  })

  test('more than two words still gives two', () => {
    assert.equal(initialsFor({ name: 'Ada King Lovelace', email: null }), 'AK')
  })

  test('no name falls back to the local part of the email', () => {
    // Not the domain: the initials of "gmail" belong to nobody.
    assert.equal(initialsFor({ name: null, email: 'dhairya.narang@gmail.com' }), 'DN')
    assert.equal(initialsFor({ name: null, email: 'dhairya@gmail.com' }), 'D')
  })

  test('the separators people actually use in addresses all split', () => {
    for (const local of ['ada.lovelace', 'ada_lovelace', 'ada-lovelace', 'ada lovelace']) {
      assert.equal(initialsFor({ name: null, email: `${local}@example.com` }), 'AL', local)
    }
  })

  test('an empty name falls through to the email rather than returning nothing', () => {
    assert.equal(initialsFor({ name: '   ', email: 'ada@example.com' }), 'A')
  })

  test('nothing at all gives nothing, so the caller can draw a glyph', () => {
    assert.equal(initialsFor({ name: null, email: null }), '')
    assert.equal(initialsFor(null), '')
  })
})

describe('the rendering branches', () => {
  test('a failed photograph falls back instead of showing a broken image', () => {
    assert.match(source, /onError=\{\(\) => setFailed\(true\)\}/, 'the failure path is not wired')
    assert.match(
      source,
      /const showPhoto = Boolean\(user\?\.avatarUrl\) && !failed/,
      'a failed load would still try to render the photograph',
    )
  })

  test('all three states are present, in order', () => {
    const photo = source.indexOf('showPhoto ?')
    const initials = source.indexOf('initials ?')
    const glyph = source.indexOf('<UserRound')
    assert.ok(photo > 0 && initials > photo && glyph > initials, 'the fallback order changed')
  })

  test('the caller owns the size and colour, so every call site keeps its design', () => {
    assert.match(source, /className\?: string/)
    assert.match(source, /rounded-full/)
    assert.match(source, /size-full object-cover/, 'the photograph no longer fills the circle')
  })

  test('both call sites use it, and neither keeps its own img', () => {
    for (const file of [
      'components/layout/account-row.tsx',
      'components/account/account-view.tsx',
    ]) {
      const call = readFileSync(root + file, 'utf8')
      assert.match(call, /<UserAvatar/, `${file} does not use the shared avatar`)
      assert.ok(!/<img /.test(call), `${file} still renders its own <img>`)
    }
  })
})
