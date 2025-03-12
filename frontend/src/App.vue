<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          Web Editor
        </q-toolbar-title>
        
        <q-tabs
          v-model="tab"
          align="right"
          class="q-ml-auto"
          indicator-color="white"
          active-color="white"
        >
          <q-route-tab name="tasks" to="/" label="Seznam úloh" />
          <q-route-tab name="editor" to="/editor" label="Editor" />
        </q-tabs>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const route = useRoute()
    const tab = ref(route.name || 'editor')
    
    // Aktualizace aktivní záložky při změně cesty
    watch(() => route.name, (newName) => {
      if (newName) {
        tab.value = newName
      }
    })
    
    return {
      tab
    }
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: 'Roboto', sans-serif;
}
</style>