import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'

import App from '../App.vue'
import vuetify from '../plugins/vuetify'
import { createAppRouter } from '../router'
import { useSessionStore } from '../stores/session'
import { fake, type FakeUser } from './firebase-mock'

vi.mock('@/firebase', async () => (await import('./firebase-mock')).firebaseModule())
vi.mock('firebase/auth', async () => (await import('./firebase-mock')).authModule())
vi.mock('firebase/firestore', async () => (await import('./firebase-mock')).firestoreModule())

const member: FakeUser = { email: 'Member@Example.com', emailVerified: true }
const outsider: FakeUser = { email: 'outsider@example.com', emailVerified: true }

/** Mounts the app at `path` with Firebase reporting `user` as the first auth state. */
async function mountAt(path: string, user: FakeUser | null) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const session = useSessionStore()
  session.init()
  fake.listener!(user)
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  const wrapper = mount(App, { global: { plugins: [pinia, router, vuetify] } })
  return { wrapper, router, session }
}

beforeEach(() => {
  fake.reset()
  fake.allowlist = { 'member@example.com': { role: 'member' }, 'owner@example.com': { role: 'owner' } }
})

describe('signed out', () => {
  it.each(['/', '/sign-in', '/not-authorised', '/anything'])('%s leads to /sign-in', async (path) => {
    const { router } = await mountAt(path, null)
    expect(router.currentRoute.value.name).toBe('sign-in')
  })

  it('shows only the enabled Google button', async () => {
    const { wrapper } = await mountAt('/', null)
    expect(wrapper.get('.v-card h1').text()).toBe('Chhaap')
    expect(wrapper.get('.v-card').text()).toContain('Sign in with your team Google account.')
    const buttons = wrapper.findAll('button.v-btn')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]!.text()).toBe('Sign in with Google')
    expect(buttons[0]!.attributes('disabled')).toBeUndefined()
    expect(wrapper.find('header.v-app-bar').exists()).toBe(false)
  })

  it('signing in as a member reaches home', async () => {
    const { wrapper, router } = await mountAt('/sign-in', null)
    fake.popup.mockResolvedValue({ user: member })
    await wrapper.get('button.v-btn').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('a closed or failed popup stays on sign-in with a short error line', async () => {
    const { wrapper, router, session } = await mountAt('/sign-in', null)
    fake.popup.mockRejectedValue(new Error('auth/popup-closed-by-user'))
    await wrapper.get('button.v-btn').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('sign-in')
    expect(session.status).toBe('signed-out')
    expect(wrapper.get('[role="alert"]').text()).toBe('Sign-in did not complete. Please try again.')
  })
})

describe('allowlisted member', () => {
  it('home shows the email and Sign out, using the lowercased allowlist key', async () => {
    const { wrapper, router, session } = await mountAt('/', member)
    expect(router.currentRoute.value.name).toBe('home')
    expect(fake.reads).toEqual(['allowlist/member@example.com'])
    expect(session.status).toBe('member')
    const bar = wrapper.get('header.v-app-bar')
    expect(bar.text()).toContain('Chhaap')
    expect(bar.text()).toContain('Member@Example.com')
    expect(bar.get('button').text()).toBe('Sign out')
    expect(wrapper.get('main.v-main h1').text()).toBe('Home')
  })

  it.each(['/sign-in', '/not-authorised', '/anything'])('%s redirects to /', async (path) => {
    const { router } = await mountAt(path, member)
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('an owner doc gives the owner status', async () => {
    const { session } = await mountAt('/', { email: 'owner@example.com', emailVerified: true })
    expect(session.status).toBe('owner')
  })

  it('signing out returns to sign-in', async () => {
    const { wrapper, router, session } = await mountAt('/', member)
    await wrapper.get('header.v-app-bar button').trigger('click')
    await flushPromises()
    expect(fake.signOut).toHaveBeenCalledOnce()
    expect(session.status).toBe('signed-out')
    expect(router.currentRoute.value.name).toBe('sign-in')
  })
})

describe('not authorised', () => {
  it.each(['/', '/sign-in', '/not-authorised', '/anything'])(
    'a verified email with no allowlist doc goes from %s to /not-authorised',
    async (path) => {
      const { router } = await mountAt(path, outsider)
      expect(router.currentRoute.value.name).toBe('not-authorised')
    },
  )

  it('shows the email and Sign out', async () => {
    const { wrapper } = await mountAt('/', outsider)
    expect(wrapper.get('main h1').text()).toBe('Not authorised')
    expect(wrapper.get('main').text()).toContain('outsider@example.com')
    expect(wrapper.get('main button').text()).toBe('Sign out')
  })

  it('an unverified email is not authorised, even when listed', async () => {
    const { router } = await mountAt('/', { email: 'member@example.com', emailVerified: false })
    expect(router.currentRoute.value.name).toBe('not-authorised')
    expect(fake.reads).toEqual([])
  })

  it('an allowlist read error counts as not authorised', async () => {
    fake.readError = true
    const { router } = await mountAt('/', member)
    expect(router.currentRoute.value.name).toBe('not-authorised')
  })

  it('a user with no email is not authorised', async () => {
    const { router } = await mountAt('/', { email: null, emailVerified: true })
    expect(router.currentRoute.value.name).toBe('not-authorised')
  })

  it('signing out returns to sign-in', async () => {
    const { wrapper, router } = await mountAt('/', outsider)
    await wrapper.get('main button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('sign-in')
  })
})

describe('session changes after the first navigation', () => {
  it('re-evaluates a removed member on the next auth event (e.g. token refresh or reload)', async () => {
    const { router } = await mountAt('/', member)
    delete fake.allowlist['member@example.com']
    fake.listener!(member)
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('not-authorised')
  })

  it('a slower, older settle cannot overwrite a newer one', async () => {
    const { router, session } = await mountAt('/sign-in', null)
    const release = fake.holdReads()
    fake.listener!(member) // member settle starts and waits on the allowlist read
    await flushPromises()
    await session.signOut() // newer settle: signed out
    release()
    await flushPromises()
    expect(session.status).toBe('signed-out')
    expect(router.currentRoute.value.name).toBe('sign-in')
  })

  it('a failed popup error is cleared by later session changes', async () => {
    const { wrapper, router, session } = await mountAt('/sign-in', null)
    fake.popup.mockRejectedValueOnce(new Error('auth/popup-closed-by-user'))
    await wrapper.get('button.v-btn').trigger('click')
    await flushPromises()
    expect(session.error).not.toBeNull()

    // A successful sign-in in another tab arrives as an auth event, not via signIn().
    fake.listener!(member)
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('home')

    await wrapper.get('header.v-app-bar button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('sign-in')
    expect(session.error).toBeNull()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('the guard waits for the first auth state', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useSessionStore().init()
    const router = createAppRouter(createMemoryHistory())
    let settled = false
    const navigation = router.push('/').then(() => (settled = true))
    await flushPromises()
    expect(settled).toBe(false)
    fake.listener!(member)
    await navigation
    expect(router.currentRoute.value.name).toBe('home')
  })
})
