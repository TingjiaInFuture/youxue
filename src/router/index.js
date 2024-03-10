import Vue from 'vue'
import Router from 'vue-router'
import RecommendationSort from '@/components/RecommendationSort'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'RecommendationSort',
      component: RecommendationSort
    }
  ]
})
