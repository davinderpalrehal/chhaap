import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '../App.vue'
import vuetify from '../plugins/vuetify'
import { routes } from '../router'

async function mountAt(path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  return mount(App, { global: { plugins: [router, vuetify] } })
}

describe('app shell', () => {
  it('shows the sign-in screen with a disabled Google button', async () => {
    const wrapper = await mountAt('/sign-in')
    expect(wrapper.get('h1').text()).toBe('Chhaap')
    const button = wrapper.get('button')
    expect(button.text()).toBe('Sign in with Google')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('shows home inside the app bar header and main', async () => {
    const wrapper = await mountAt('/')
    expect(wrapper.get('header').text()).toContain('Chhaap')
    expect(wrapper.get('main h1').text()).toBe('Home')
    expect(wrapper.get('main').text()).toContain('Nothing here yet.')
  })
})
