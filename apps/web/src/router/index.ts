import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import SignInView from '@/views/SignInView.vue'

// Route guards (signed-in, allowlisted) arrive with sign-in in Story 1.2.
export const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/sign-in', name: 'sign-in', component: SignInView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
