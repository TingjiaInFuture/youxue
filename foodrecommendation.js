const { createApp, ref, onMounted, inject, computed } = Vue
const FoodRecommendation = {
    template:`
<div class="food-body">
    <p class="food-header">
    <h1>美食推荐</h1>
    </p>
    <section id="filters">
        <h2>筛选</h2>
        <form @submit.prevent="applyFilters" class="food-form">
            <label for="location">地点：</label>
            <select v-model="selectedLocation" id="location">
                <option v-for="location in locations" :key="location.name" :value="location.name">{{ location.name }}</option>
            </select>

            <label for="cuisine">菜系：</label>
            <select v-model="selectedCuisine" id="cuisine">
                <option value="">所有</option>
                <option v-for="cuisine in cuisines" :key="cuisine">{{ cuisine }}</option>
            </select>

            <label for="sort-by">排序依据：</label>
            <select v-model="sortBy" id="sort-by">
                <option value="popularity">热度</option>
                <option value="rating">评分</option>
                <option value="distance">距离</option>
                <option value="comprehensive">综合推荐</option>
            </select>

            <button type="submit">应用筛选</button>
        </form>
    </section>

    <section id="search">
        <h2>搜索</h2>
        <form @submit.prevent="searchFood">
            <input type="text" v-model="searchQuery" placeholder="输入菜名或饭店名称">
            <button type="submit">搜索</button>
        </form>
        <div id="search-info">你可以输入菜名、所在饭店名称进行搜索。</div>
    </section>

    <section id="results">
        <h2>结果</h2>
        <ul id="food-list">
            <li v-for="food in displayedFoods" :key="uniqueKey(food)" class="food-item">
                <img :src="food.image" alt="food image">
                <div class="food-item-content">
                    <h3>{{ food.name }}</h3>
                    <p>{{ food.cuisine }}</p>
                    <p>
                        <span>评分：{{ food.rating }}</span>
                        <span>热度：{{ food.popularity }}</span>
                        <span>距离：{{ food.distance }}m</span>
                    </p>
                    <p>所在饭店：{{ food.restaurant }}</p>
                </div>
            </li>
        </ul>
    </section>
</div>
    `,
    setup(){
        let locations = ref('');
        let selectedCuisine = ref('');
        let sortBy = ref('popularity');
        let searchQuery = ref('');
        let displayedFoods = ref([]);
        let cuisines = ref(["川菜", "鲁菜", "淮扬菜", "粤菜", "浙江菜", "闽菜", "湘菜", "徽菜"]);
        const state = inject('state')
        let selectedLocation = computed(() => {
            return state.selectedItem ? state.selectedItem.nameSight : ''
          })
        const loadScript = (url, callback) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.onload = callback;
            document.head.appendChild(script);
        };
        onMounted(() => {
            loadScript('./json/foodData.js', () => {
                locations.value = foodData;
                selectedLocation.value = locations.value.length > 0 ? locations.value[0].name : '';
                applyFilters();
            });
        });
        const applyFilters = () => {
            if (selectedLocation.value) {
                const location = locations.value.find(loc => loc.name === selectedLocation.value);
                if (location) {
                    let filteredFoods = location.dishes;
                    if (selectedCuisine.value) {
                        filteredFoods = filteredFoods.filter(food => food.cuisine === selectedCuisine.value);
                    }
                    displayedFoods.value = getTop10(filteredFoods);
                }
            }
        };

        const searchFood = () => {
            if (selectedLocation.value) {
                const location = locations.value.find(loc => loc.name === selectedLocation.value);
                if (location) {
                    let results = location.dishes.filter(food =>
                        food.name.includes(searchQuery.value) ||
                        food.cuisine.includes(searchQuery.value) ||
                        food.restaurant.includes(searchQuery.value)
                    );
                    displayedFoods.value = getTop10(results);
                }
            }
        };

        const getTop10 = (foods) => {
            return foods.sort((a, b) => {
                if (sortBy.value === 'popularity') {
                    return b.popularity - a.popularity;
                } else if (sortBy.value === 'rating') {
                    return b.rating - a.rating;
                } else if (sortBy.value === 'distance') {
                    return a.distance - b.distance;
                } else if (sortBy.value === 'comprehensive') {
                    return comprehensiveScore(b) - comprehensiveScore(a);
                }
            }).slice(0, 10);
        };

        const comprehensiveScore = (food) => {
            const normPopularity = food.popularity / 100;
            const normRating = food.rating / 5;
            const normDistance = 1 - (food.distance / 3000);

            return (normPopularity * 0.4) + (normRating * 0.4) + (normDistance * 0.2);
        };

        const uniqueKey = (food) => {
            return `${food.name}-${food.restaurant}-${food.location}`;
        };

        return {
            locations,
            selectedLocation,
            selectedCuisine,
            sortBy,
            searchQuery,
            displayedFoods,
            cuisines,
            applyFilters,
            searchFood,
            getTop10,
            comprehensiveScore,
            uniqueKey
        }
    }
}

// const app = createApp({
//     components: {
//       FoodRecommendation
//     }
//   })

//   app.mount('#app-food')
export default FoodRecommendation;