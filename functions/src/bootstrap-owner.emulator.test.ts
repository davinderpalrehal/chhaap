import { execFile } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import type { Firestore } from 'firebase-admin/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { bootstrapOwner, OwnerExistsError } from './bootstrap-owner.js'
import { clearFirestore, emulatorDb } from './emulator.js'

let db: Firestore
let close: () => Promise<void>

beforeAll(() => {
  ;({ db, close } = emulatorDb('bootstrap-test'))
})

beforeEach(async () => {
  await clearFirestore()
})

afterAll(async () => {
  await close?.()
})

async function allowlist() {
  const snap = await db.collection('allowlist').get()
  return Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))
}

describe('bootstrapOwner', () => {
  it('writes the lowercased owner doc when no owner exists', async () => {
    await expect(bootstrapOwner(db, ' Owner@X.com ')).resolves.toBe('owner@x.com')
    expect(await allowlist()).toEqual({ 'owner@x.com': { role: 'owner' } })
  })

  it('promotes an existing member doc when no owner exists', async () => {
    await db.doc('allowlist/owner@x.com').set({ role: 'member' })
    await bootstrapOwner(db, 'owner@x.com')
    expect(await allowlist()).toEqual({ 'owner@x.com': { role: 'owner' } })
  })

  it('refuses and writes nothing when an owner exists', async () => {
    await bootstrapOwner(db, 'owner@x.com')
    const error = await bootstrapOwner(db, 'someone@x.com').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(OwnerExistsError)
    expect((error as OwnerExistsError).message).toContain('owner@x.com')
    expect(await allowlist()).toEqual({ 'owner@x.com': { role: 'owner' } })
  })

  it('rejects a bad email and writes nothing', async () => {
    await expect(bootstrapOwner(db, 'not-an-email')).rejects.toMatchObject({ name: 'ZodError' })
    expect(await allowlist()).toEqual({})
  })
})

describe('owner:bootstrap CLI', () => {
  const script = fileURLToPath(new URL('../scripts/bootstrap-owner.ts', import.meta.url))
  const run = (args: string[], env: NodeJS.ProcessEnv = process.env) =>
    promisify(execFile)(process.execPath, [script, ...args], { env }).then(
      ({ stdout, stderr }) => ({ code: 0, stdout, stderr }),
      (error: { code: number; stdout: string; stderr: string }) => error,
    )

  it('writes the owner on the first run and refuses on the second', async () => {
    const first = await run(['--email', 'Owner@X.com'])
    expect(first).toMatchObject({ code: 0 })
    expect(first.stdout).toContain('allowlist/owner@x.com')

    const second = await run(['--email', 'other@x.com'])
    expect(second.code).not.toBe(0)
    expect(second.stderr).toContain('An owner already exists (owner@x.com)')
    expect(await allowlist()).toEqual({ 'owner@x.com': { role: 'owner' } })
  })

  it('exits non-zero with the zod message for a bad email', async () => {
    const result = await run(['--email', 'not-an-email'])
    expect(result.code).not.toBe(0)
    expect(result.stderr).toMatch(/Invalid --email: .*email/i)
    expect(await allowlist()).toEqual({})
  })

  it('requires --email', async () => {
    const result = await run([])
    expect(result.code).not.toBe(0)
    expect(result.stderr).toContain('--email is required')
  })

  it('refuses to run without the emulator or an explicit --project', async () => {
    const env = { ...process.env }
    delete env.FIRESTORE_EMULATOR_HOST
    const result = await run(['--email', 'owner@x.com'], env)
    expect(result.code).not.toBe(0)
    expect(result.stderr).toContain('FIRESTORE_EMULATOR_HOST')
    expect(await allowlist()).toEqual({})
  })
})
