import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue' // Imports your new middle section

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    }
  ]
})

export default router
