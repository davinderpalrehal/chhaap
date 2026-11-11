import { describe, expect, it, vi } from 'vitest'

import * as functions from './index.js'
import { handleRedirect } from './redirect/index.js'

type Req = Parameters<typeof handleRedirect>[0]
type Res = Parameters<typeof handleRedirect>[1]

function fakeResponse() {
  const res = {} as Record<'status' | 'set' | 'type' | 'send', ReturnType<typeof vi.fn<() => unknown>>>
  for (const key of ['status', 'set', 'type', 'send'] as const) {
    res[key] = vi.fn<() => unknown>(() => res)
  }
  return res
}

describe('redirect placeholder', () => {
  it('answers every path with an uncached 404', () => {
    const res = fakeResponse()
    handleRedirect({ path: '/abc23' } as Req, res as unknown as Res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store')
    expect(res.send).toHaveBeenCalledOnce()
  })
})

describe('function exports', () => {
  it('exports only the redirect function so far', () => {
    expect(Object.keys(functions)).toEqual(['redirect'])
  })

  it('deploys redirect to africa-south1 with public invocation', () => {
    const endpoint = (functions.redirect as unknown as { __endpoint: Record<string, unknown> })
      .__endpoint
    expect(endpoint.region).toEqual(['africa-south1'])
    expect(endpoint.httpsTrigger).toMatchObject({ invoker: ['public'] })
  })
})
