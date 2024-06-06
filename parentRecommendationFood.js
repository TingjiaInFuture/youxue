const { createApp, reactive, provide } = Vue
import RecommendationSort from './recommendation.js'
import FoodRecommendation from './foodrecommendation.js'

const ParentRecommendationFood = {
    components: {
        RecommendationSort,
        FoodRecommendation
      },
      setup() {
        const state = reactive({
          selectedItem: null
        })

        provide('state', state)

        return state
      },
      template: `
        <div>
            <recommendation-sort></recommendation-sort>
            <food-recommendation></food-recommendation>
        </div>
      `
}
const app = createApp({
    components: {
      ParentRecommendationFood
    }
  })

  app.mount('#app-parent-rec-food')