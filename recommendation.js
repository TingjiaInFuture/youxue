const { createApp, ref, watch, inject  } = Vue
import sights_list from './json/SightsInfo.js';
const dynamicJson = await axios.get("https://youxueserver-a-wcwgrndlcd.cn-hangzhou.fcapp.run/getAreas");
class MinHeap {
  // 最小堆实现不通过完全排序提取排名前十的元素
  constructor () {
    this.heap = []
    // console.log(JSON.parse(JSON.stringify(this.heap)))
  }
  insert (item) {
    //使用Wilson Score算法计算综合好评率（一种综合大样本和小样本的较为公平的好评率计算算法）
    let z = 1.96
    let n = item.score+item.badScore
    let p = item.score/n
    item.combinedScore = (p + z*z/(2*n) - z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)) / (1+z*z/n)
    this.heap.push(item)
    this.bubbleUp(this.heap.length - 1)
  }
  // 将元素冒上堆顶
  bubbleUp (index) {
    while (index > 0) {
      let parentIndex = Math.floor((index - 1) / 2)
      if (this.heap[parentIndex] && this.heap[parentIndex].combinedScore <= this.heap[index].combinedScore) {
        break
      }
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]]
      index = parentIndex
    }
  }
  // 提取最小值，就是堆顶
  extractMin () {
    if (this.heap.length <= 1) {
      return
    }
    const min = this.heap[0]
    const end = this.heap.pop()
    if (this.heap.length > 0) {
      this.heap[0] = end
      // 先取堆的末尾临时充当堆顶
      this.sinkDown(0)
    }
    return min
  }
  // 提取堆顶后，重新整理堆使其符合规则
  sinkDown (index) {
    let length = this.heap.length
    while (true) {
      let leftChildIndex = 2 * index + 1
      let rightChildIndex = 2 * index + 2
      let swapIndex = null
      // 决定哪个孩子翻上来
      if (leftChildIndex < length) {
        if (this.heap[leftChildIndex].combinedScore < this.heap[index].combinedScore) {
          swapIndex = leftChildIndex
        }
      }
      if (rightChildIndex < length) {
        // 额外判定右孩子和左孩子的关系
        if ((swapIndex === null && this.heap[rightChildIndex].combinedScore < this.heap[index].combinedScore) || (swapIndex !== null && this.heap[rightChildIndex].combinedScore < this.heap[swapIndex].combinedScore)) {
          swapIndex = rightChildIndex
        }
      }
      if (swapIndex === null) {
        break
      }
      [this.heap[index], this.heap[swapIndex]] = [this.heap[swapIndex], this.heap[index]]
      index = swapIndex
    }
  }
  size () {
    return this.heap.length
  }
}
//排序算法更改：使用Wilson算法根据好评数和差评数综合排序
const RecommendationSort = {
  template: `
  <div>
    <p>
      <h1>
          游学推荐
      </h1>
    </p>
    <div class="warning" v-if="warningMsg">
      <i class="fas fa-exclamation-triangle"></i>
      {{ warningMsg }}
    </div>
    <p>
    <div class="selector-wrapper">
      <select v-model = "selectedType">
        <option value="all">--类型筛选--</option>
        <option value="景点">景点</option>
        <option value="学校">学校</option>
      </select>
      <select v-model="limitedNumber">
        <option v-for="number in numbers" :key="number" :value="number">{{ number }}</option>
      </select>
      <input placeholder="--搜索--" v-model = "searchTerm">
      <div class="radio-group">
        按照：
        <label><input type="radio" v-model="sortField" value="views"> 浏览量</label>
        <label><input type="radio" v-model="sortField" value="combinedScore">综合好评率</label>
        排序
      </div>
    </div>
    </p>
    <div class="container">
      <div class="item" v-for="(item, index) in topItems" :key="index" @click="selectItem(item)">
        <img alt="琪露诺加载不出资源，琪露诺坏" :src="'./assets/img/' + (item.areaId-6) + '.jpg'" class="item-img">
        <div class="item-info">
          <div class="item-name">{{ item.nameSight }}</div>
          <div class="item-stats">
            <span class="stat-box"><i class="fas fa-tags type-icon"></i>{{ item.type }}</span>
            <span class="stat-box"><i class="fas fa-eye view-icon"></i>浏览量: {{ item.views }}</span>
            <span class="stat-box" @click="increaseScore(item)"><i class="fas fa-thumbs-up score-icon" :class="{ 'active': item === selectedGoodItem }"></i> 好评: {{ item.score }} <transition name="fade"><span v-if="item === selectedGoodItem" class="plus-one">+1</span></transition></span>
            <span class="stat-box" @click="increaseBadScore(item)"><i class="fas fa-thumbs-down badscore-icon" :class="{ 'active': item === selectedBadItem }"></i> 差评: {{ item.badScore }} <transition name="fade"><span v-if="item === selectedBadItem" class="plus-one">+1</span></transition></span>
          </div>
        </div>
      </div>
    </div>
    <div class="container-pages">
      <button class="btn" @click="goToPreviousPage" :disabled="currentPage === 1">上一页</button>
      <select class="select" v-model="currentPage" @change="goToPage">
        <option v-for="page in totalPages" :key="page" :value="page">--{{ page }}--</option>
      </select>
      <button class="btn" @click="goToNextPage" :disabled="currentPage === totalPages">下一页</button>
    </div>
  </div>
  `,
  setup() {
    // 在这里定义你的响应式数据和方法
    let selectedType = ref('all')
    let searchTerm = ref('')
    let limitedNumber = ref('10')
    let numbers = ref([5, 10, 15, 20, 50,100,200])
    let items = ref(sights_list.item)
    let topItems = ref([])
    let currentPage = ref(1)
    let pageSize = ref(10)
    let totalPages = ref(0)
    let selectedItem = ref(null)
    let sortField = ref('views') // 新增的响应式数据，用于存储选择的排序字段
    let selectedGoodItem = ref(null)
    let selectedBadItem = ref(null)// 新增的响应式数据，用于存储选中的差评项目
    let voteGoodStatus = ref({})
    let voteBadStatus = ref({})
    let warningMsg = ref(null)
    let views = ref(0)
    let goods = ref(0)
    let bads = ref(0)
    const state = inject('state')
    updateTopItems()
    // console.log(dynamicJson.data[1]);
    function updateTopItems () {
      let heap = new MinHeap()
      items.value.forEach(item => {
        // 逐个元素插入，保证堆的元素不大于10
        if ((selectedType.value === 'all' || item.type === selectedType.value) && kmpSearch(item.nameSight, searchTerm.value) !== -1) {
          item.views = dynamicJson.data[item.areaId-1].views;
          item.score = dynamicJson.data[item.areaId-1].goods;
          item.badScore = dynamicJson.data[item.areaId-1].bads;
          heap.insert(item)
          console.log(limitedNumber.value)
          if (heap.size() > limitedNumber.value) {
            heap.extractMin();
          }
          //这个if是为了满足”不全排序“的要求
        }
      })
      // 处理翻页
      totalPages.value = Math.ceil(heap.size() / pageSize.value)
      // 然后再排序！
      if(sortField.value === 'views') {
        topItems.value = quickSort(heap.heap, 0, heap.heap.length - 1,'views').slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
        // console.log(sortField.value)
      } else {
        topItems.value = quickSort(heap.heap, 0, heap.heap.length - 1, 'combinedScore').slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
        // console.log(sortField.value)
      }
    }
    // 快速排序
    function quickSort (items, left, right, field) {
      // console.log(JSON.parse(JSON.stringify(items)))
      if (left < right) {
        let pivotIndex = partition(items, left, right, field)
        quickSort(items, left, pivotIndex - 1, field)
        quickSort(items, pivotIndex + 1, right, field)
      }
      return items
    }
    function partition (items, left, right, field) {
      let pivot = items[right][field]
      let i = left
      for (let j = left; j < right; j++) {
        if (items[j][field] > pivot) {
          [items[i], items[j]] = [items[j], items[i]]
          i++
        }
      }
      [items[i], items[right]] = [items[right], items[i]]
      return i
    }
    // KMP
    function kmpSearch (text, pattern) {
      if (pattern.length === 0) {
        return 0
      }
      let prefixTable = buildPrefixTable(pattern)
      let i = 0
      let j = 0
      while (i < text.length) {
        if (text[i] === pattern[j]) {
          if (j === pattern.length - 1) return i - j
          i++
          j++
        } else if (j > 0) {
          j = prefixTable[j - 1]
        } else {
          i++
        }
      }
      return -1
    }
    function buildPrefixTable (pattern) {
      let prefixTable = new Array(pattern.length).fill(0)
      let i = 1
      let j = 0
      while (i < pattern.length) {
        if (pattern[i] === pattern[j]) {
          prefixTable[i] = j + 1
          i++
          j++
        } else if (j > 0) {
          j = prefixTable[j - 1]
        } else {
          i++
        }
      }
      return prefixTable
    }
    // turn page
    function goToPage () {
      updateTopItems()
    }
    function goToNextPage () {
      if (currentPage.value < totalPages.value) {
        currentPage.value++
      }
      updateTopItems()
    }
    function goToPreviousPage () {
      if (currentPage.value > 1) {
        currentPage.value--
      }
      updateTopItems()
    }
    function selectItem(item) {
      state.selectedItem = item
      console.log(state.selectedItem.nameSight)
    }
    async function increaseScore(item) {
      if (voteGoodStatus[item.areaId-1]) {
        warningMsg = '你已经对这个项目进行过评价了！'
      } else {
        item.score++
        selectedGoodItem.value = item
        selectedBadItem.value = null
        voteGoodStatus[item.areaId-1] = true
        const base_url = 'https://youxueserver-a-wcwgrndlcd.cn-hangzhou.fcapp.run';
        const id = item['areaId'];
        let response;
        try {
          response = await axios.put(`${base_url}/area/${id}/goods`);
          if (response.status !== 200) {
              console.log(`更新地区${id}的好评数失败，错误消息：${response.data.message}`);
          } else {
            console.log("success");
            item['views']+=1;
            item['goods']+=1;
          }
        } catch (error) {
          console.log(error);
        }
      }
    }

    async function increaseBadScore(item) {
      if (voteBadStatus[item.areaId-1]) {
        warningMsg = '你已经对这个项目进行过评价了！'
      } else {
        item.badScore++
        selectedBadItem.value = item
        selectedGoodItem.value = null
        voteBadStatus[item.areaId-1] = true
        const base_url = 'https://youxueserver-a-wcwgrndlcd.cn-hangzhou.fcapp.run';
        const id = item['areaId'];
        let response;
        try {
          response = await axios.put(`${base_url}/area/${id}/bads`);
          if (response.status !== 200) {
              console.log(`更新地区${id}的好评数失败，错误消息：${response.data.message}`);
          } else {
            console.log("success");
            item['views']+=1;
            item['bads']+=1;
          }
        } catch (error) {
          console.log(error);
        }
      }
    }
    // 监听 selectedType 和 searchTerm 的变化
    watch(selectedType, updateTopItems)
    watch(searchTerm, updateTopItems)
    watch(sortField, updateTopItems)
    watch(limitedNumber, updateTopItems)
    return {
      selectedType,
      searchTerm,
      limitedNumber,
      numbers,
      items,
      topItems,
      currentPage,
      pageSize,
      totalPages,
      selectedItem,
      sortField,
      selectedGoodItem,
      selectedBadItem,
      voteGoodStatus,
      voteBadStatus,
      warningMsg,
      views,
      goods,
      bads,
      state,
      updateTopItems,
      quickSort,
      partition,
      kmpSearch,
      buildPrefixTable,
      goToPage,
      goToNextPage,
      goToPreviousPage,
      selectItem,
      increaseScore,
      increaseBadScore
    }
  }
}

// const app = createApp({
//   components: {
//     RecommendationSort
//   }
// })

// app.mount('#app-recommendation')
export default RecommendationSort;