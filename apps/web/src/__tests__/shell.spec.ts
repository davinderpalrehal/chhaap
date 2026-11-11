import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '../App.vue'
import AppButton from '../components/AppButton.vue'
import { routes } from '../router'

async function mountAt(path: string) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()
  return mount(App, { global: { plugins: [router] } })
}

describe('app shell', () => {
  it('shows the sign-in screen with a disabled Google button', async () => {
    const wrapper = await mountAt('/sign-in')
    const button = wrapper.get('button')
    expect(button.text()).toBe('Sign in with Google')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('shows home inside the layout header and main', async () => {
    const wrapper = await mountAt('/')
    expect(wrapper.get('header').text()).toContain('Chhaap')
    expect(wrapper.get('main h1').text()).toBe('Home')
  })
})

describe('AppButton', () => {
  it('defaults to a primary, enabled, type=button button', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Go' } })
    const button = wrapper.get('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.classes()).toContain('app-button--primary')
    expect(button.attributes('disabled')).toBeUndefined()
  })
})
