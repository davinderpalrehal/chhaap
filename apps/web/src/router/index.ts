import { watch } from 'vue'
import { createRouter, createWebHistory, type RouterHistory } from 'vue-router'

import { useSessionStore, type SessionStatus } from '@/stores/session'
import HomeView from '@/views/HomeView.vue'
import NotAuthorisedView from '@/views/NotAuthorisedView.vue'
import SignInView from '@/views/SignInView.vue'

export const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/sign-in', name: 'sign-in', component: SignInView },
  { path: '/not-authorised', name: 'not-authorised', component: NotAuthorisedView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

/** The only route each non-member status may show; members may go anywhere else. */
const ONLY_ROUTE: Partial<Record<SessionStatus, string>> = {
  'signed-out': 'sign-in',
  'not-authorised': 'not-authorised',
}

export function createAppRouter(history: RouterHistory = createWebHistory(import.meta.env.BASE_URL)) {
  const router = createRouter({ history, routes })

  // Every screen needs a signed-in team member (AD-8). The guard waits for the
  // first auth state, so a reload never flashes the sign-in screen to a member.
  router.beforeEach(async (to) => {
    const session = useSessionStore()
    await session.ready
    const only = ONLY_ROUTE[session.status]
    if (only) return to.name === only ? true : { name: only }
    return to.name === 'sign-in' || to.name === 'not-authorised' ? { name: 'home' } : true
  })

  // Re-run the guard when the session status changes after the first navigation:
  // sign-in, sign-out, or any later Firebase auth event (e.g. a token refresh).
  let watching = false
  router.afterEach(() => {
    if (watching) return
    watching = true
    const session = useSessionStore()
    watch(
      () => session.status,
      () => void router.replace({ path: router.currentRoute.value.fullPath, force: true }),
    )
  })

  return router
}

export default createAppRouter()
