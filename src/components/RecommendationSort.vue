<template>
    <div>
      <h1>
        景点Top10排行！
      </h1>
        <ul>
            <li v-for="(item, index) in sortedItems" :key="index">
              {{ index + 1 }}. {{ item.nameSight }} - 浏览量: {{ item.views }}
            </li>
        </ul>
    </div>
</template>

<script>
export default {
  name: 'RecommendationSort',
  data () {
    return {
      items: [
        {nameSight: '景点1', views: 120},
        {nameSight: '景点2', views: 180},
        {nameSight: '景点3', views: 200},
        {nameSight: '景点4', views: 20},
        {nameSight: '景点5', views: 10},
        {nameSight: '景点6', views: 60},
        {nameSight: '景点7', views: 50},
        {nameSight: '景点8', views: 240},
        {nameSight: '景点9', views: 125},
        {nameSight: '景点10', views: 230},
        {nameSight: '景点11', views: 213}
      ]
    }
  },
  // computed属性不能直接修改原始数据
  computed: {
    // 排序！（排序算法待补充）
    sortedItems () {
      let itemsCopy = [...this.items]
      return itemsCopy.sort((a, b) => b.views - a.views).slice(0, 10)
    }
  }
}
</script>
