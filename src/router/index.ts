import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/home/HomeView.vue' // Imports your new middle section
import PropertyListingView from '../views/home/dynamic/buy/PropertyListingView.vue'
import PropertyDetailView from '../views/home/dynamic/buy/PropertyDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/listings',
      name: 'property-listings',
      component: PropertyListingView
    },
    {
      path: '/property/:id',
      name: 'property-detail',
      component: PropertyDetailView
    }
  ]
})

export default router
