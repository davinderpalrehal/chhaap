// Vuetify's styles come first so their cascade layers are declared before the
// app's `app` layer (base.css), which then wins without `!important`.
import 'vuetify/styles'
import './styles/tokens.css'
import './styles/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { useSessionStore } from './stores/session'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
// Initialises Firebase (via the store's import) and subscribes to auth state
// before the router's first navigation, which waits for `session.ready`.
useSessionStore(pinia).init()
app.use(router)
app.use(vuetify)

app.mount('#app')
