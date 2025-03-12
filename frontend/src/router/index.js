import { createRouter, createWebHistory } from 'vue-router'
import EditorPage from '../pages/EditorPage.vue'
import TasksPage from '../pages/TasksPage.vue'

const routes = [
  {
    path: '/',
    name: 'tasks',
    component: TasksPage
  },
  {
    path: '/editor',
    name: 'editor',
    component: EditorPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router