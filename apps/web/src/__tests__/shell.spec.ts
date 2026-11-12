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
    expect(wrapper.get('.v-card h1').text()).toBe('Chhaap')
    expect(wrapper.get('.v-card').text()).toContain('Sign in with your team Google account.')
    const button = wrapper.get('button.v-btn')
    expect(button.text()).toBe('Sign in with Google')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('shows home inside the app bar header and main', async () => {
    const wrapper = await mountAt('/')
    expect(wrapper.get('header.v-app-bar').text()).toContain('Chhaap')
    expect(wrapper.get('main.v-main h1').text()).toBe('Home')
    expect(wrapper.get('main').text()).toContain('Nothing here yet.')
  })
})
