<template>
    <div>
      <h1>
        景点Top10排行！!
      </h1>
      <p>
        <select v-model = "selectedType">
          <option value="all">--类型筛选--</option>
          <option value="景点">景点</option>
          <option value="学校">学校</option>
        </select>
        <input placeholder="--搜索--" v-model = "searchTerm">
        展示个数：
        <select v-model = "limitedNumber">
          <option v-for = "number in numbers" :key = "number" :value = "number">{{ number }}</option>
        </select>
      </p>
        <ul style="list-style: none;">
            <li v-for="(item, index) in topItems" :key="index">
              {{ index + 1 }}. {{ item.nameSight }} --- 浏览量: {{ item.views }} --- 评分：{{ item.score }}
            </li>
        </ul>
    </div>
</template>
<style>
p {
  text-align: center;
}
</style>
<script>
import axios from 'axios'
export default {
  name: 'RecommendationSort',
  data () {
    return {
      selectedType: 'all',
      searchTerm: '',
      limitedNumber: '10',
      numbers: [5, 10, 15, 20, 50],
      // json
      items: [],
      topItems: []
    }
  },
  created () {
    axios.get('/static/json/SightsInfo.json')
      .then(response => {
        this.items = response.data
        this.updateTopItems()
      })
      .catch(error => {
        console.log(error)
      })
  },
  watch: {
    selectedType: 'updateTopItems',
    searchTerm: 'updateTopItems',
    limitedNumber: 'updateTopItems'
  },
  methods: {
    updateTopItems () {
      let heap = new MinHeap()
      let a1 = 0.1
      let a2 = 0.9
      // console.log(heap.heap[0])
      // console.clear()
      // let i = 1
      this.items.item.forEach(item => {
        // 逐个元素插入，保证堆的元素不大于10
        // 加入筛选标签（可拓展）
        // 加入搜索判定
        // console.log('循环次数：' + i)
        item.combinedScore = a1 * item.views + a2 * item.score
        // 按照浏览量和用户评分的加权平均排序
        if ((this.selectedType === 'all' || item.type === this.selectedType) && this.kmpSearch(item.nameSight, this.searchTerm) !== -1) {
          heap.insert(item)
        }
        if (heap.size() > this.limitedNumber) {
          heap.extractMin()
        }
        // i++
      })
      // 然后再排序！
      this.topItems = this.quickSort(heap.heap, 0, heap.heap.length - 1)
      console.log(JSON.parse(JSON.stringify(heap.heap)))
    },
    // .sort((a, b) => b.views - a.views)
    // 快速排序
    quickSort (items, left, right) {
      // console.log(JSON.parse(JSON.stringify(items)))
      if (left < right) {
        let pivotIndex = this.partition(items, left, right)
        this.quickSort(items, left, pivotIndex - 1)
        this.quickSort(items, pivotIndex + 1, right)
      }
      return items
    },
    partition (items, left, right) {
      let pivot = items[right].combinedScore
      let i = left
      for (let j = left; j < right; j++) {
        if (items[j].combinedScore > pivot) {
          [items[i], items[j]] = [items[j], items[i]]
          i++
        }
      }
      [items[i], items[right]] = [items[right], items[i]]
      return i
    },
    // KMP
    kmpSearch (text, pattern) {
      if (pattern.length === 0) {
        return 0
      }
      let prefixTable = this.buildPrefixTable(pattern)
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
    },
    buildPrefixTable (pattern) {
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
  }
}
class MinHeap {
  // 最小堆实现不通过完全排序提取排名前十的元素
  constructor () {
    this.heap = []
    // console.log(JSON.parse(JSON.stringify(this.heap)))
  }
  insert (item) {
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
// todo list:
// 1. 更好的搜索，模糊搜索
// 2. 更好的推荐算法（个人兴趣、评价）
// 3. 分页推流
</script>
