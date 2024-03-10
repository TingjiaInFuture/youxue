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
        <ul>
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
      items: []
    }
  },
  created () {
    axios.get('@/public/SightsInfo.json')
      .then(Response => {
        this.items = Response.data
      })
      .catch(Error => {
        console.log(Error)
      })
  },
  computed: {
    topItems () {
      let heap = new MinHeap()
      this.items.forEach(item => {
        // 逐个元素插入，保证堆的元素不大于10
        // 加入筛选标签（可拓展）
        // 加入搜索判定
        if ((this.selectedType === 'all' || item.type === this.selectedType) && item.nameSight.includes(this.searchTerm)) {
          heap.insert(item)
        }
        if (heap.size() > this.limitedNumber) {
          heap.extractMin()
        }
      })
      // 然后再排序！
      this.quickSort(heap.heap, 0, heap.heap.length - 1)
      return heap.heap
    }
  },
  methods: {
    // 快速排序
    quickSort (items, left, right) {
      if (left < right) {
        let pivotIndex = this.partition(items, left, right)
        this.quickSort(items, left, pivotIndex - 1)
        this.quickSort(items, pivotIndex + 1, right)
      }
    },
    partition (items, left, right) {
      let pivot = items[right].views
      let i = left
      for (let j = left; j < right; j++) {
        if (items[j].views > pivot) {
          [items[i], items[j]] = [items[j], items[i]]
          i++
        }
      }
      [items[i], items[right]] = [items[right], items[i]]
      return i
    },
    // KMP
    kmpResearch (text, pattern) {
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
  constructor (heap) {
    this.heap = []
  }
  insert (item) {
    this.heap.push(item)
    this.bubbleUp(this.heap.length - 1)
  }
  // 将元素冒上堆顶
  bubbleUp (index) {
    while (index > 0) {
      let parentIndex = Math.floor((index - 1) / 2)
      if (this.heap[parentIndex] && this.heap[parentIndex].views <= this.heap[index].views) {
        break
      }
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]]
      index = parentIndex
    }
  }
  // 提取最小值，就是堆顶
  extractMin () {
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
        if (this.heap[leftChildIndex].views < this.heap[index].views) {
          swapIndex = leftChildIndex
        }
      }
      if (rightChildIndex < length) {
        // 额外判定右孩子和左孩子的关系
        if ((swapIndex === null && this.heap[rightChildIndex].views < this.heap[index].views) || (swapIndex !== null && this.heap[rightChildIndex].views < this.heap[swapIndex].views)) {
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

</script>
