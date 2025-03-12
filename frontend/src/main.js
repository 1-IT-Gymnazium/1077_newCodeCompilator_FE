import { createApp } from 'vue'
import { Quasar, Dialog, Notify } from 'quasar'
import App from './App.vue'
import router from './router'

// Import Quasar CSS
import 'quasar/dist/quasar.css'
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/roboto-font/roboto-font.css'

// Import Quasar components and directives
import * as components from 'quasar'
import * as directives from 'quasar'

const app = createApp(App)

app.use(Quasar, {
  plugins: {
    Dialog,
    Notify
  },
  components,
  directives,
  config: {
    brand: {
      primary: '#1976D2',
      secondary: '#26A69A',
      accent: '#9C27B0',
      dark: '#1D1D1D',
      positive: '#21BA45',
      negative: '#C10015',
      info: '#31CCEC',
      warning: '#F2C037'
    }
  }
})

app.use(router)
app.mount('#app')