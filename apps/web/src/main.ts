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

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
