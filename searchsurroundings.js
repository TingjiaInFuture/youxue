const { createApp, ref, computed } = Vue
import graph1 from './json/graph1.js';
import graph2 from './json/graph2.js';
import graph3 from './json/graph3.js';
import graph4 from './json/graph4.js';
import graph5 from './json/graph5.js';
import sights_list from './json/SightsInfo.js';
const graphs = { graph1, graph2, graph3, graph4, graph5 };
const SearchSurroundings = {
  template: `
  <div class="app-surroundings">
  <h1 class="route_title">查询周边</h1>
  <div class="selector-wrapper">
      <input type="text" v-model="graphFilter" placeholder="请输入学校或景点名称...">
      <select v-model="selectedAreaId" @change="loadGraph">
      <option v-for="sight in sights" :value="sight.areaId">{{ sight.nameSight }}</option>
    </select>
  </div>
  <div class="selector-wrapper">
      <input type="text" v-model="nodeSearch" placeholder="请输入设施类别...">
      <select v-model="selectedNode" @change="selectNodeFromDropdown">
          <option v-for="node in filteredNodes" :value="node">{{ node }}</option>
      </select>
  </div>
  <p class="highlighted">已选中：{{ selectedNode || '请选中地点以查询周边' }}</p>
  <div id="network-alt"></div>
  <input type="number" v-model.number="maxDistance" placeholder="请输入中心辐射距离">
  <button type="button" @click="search">搜索</button>
  <p class="highlighted">您可以按地点类型对结果进行筛选：</p>
  <div class="selector-wrapper">
      <select multiple v-model="selectedTypes">
          <option value="">不筛选</option>
          <option v-for="type in allNodeTypes" :value="type">{{ type }}</option>
      </select>
  </div>
  <div id="results">
    <div v-if="filteredResults.length">
    <div v-for="(result, index) in filteredResults" :key="result.name" class="result-item">
        <div>
            <i class="fa fa-building building-icon" aria-hidden="true"></i> 设施类型：{{ result.type }}
        </div>
        <div>
            <i class="fa fa-map-marker map-icon" aria-hidden="true"></i> 地点名称：{{ result.name }}
        </div>
        <div>
            <i class="fa fa-road road-icon" aria-hidden="true"></i> 距离：{{ result.distance }}m
        </div>
    </div>
    </div>
    <div v-else class="no-results">
        <h2>在当前条件下没有结果</h2>
    </div>
  </div>
  </div>
  `,
  setup() {
    const graphNames = ref(['graph1', 'graph2', 'graph3', 'graph4', 'graph5']);
    let selectedGraph = ref(graphNames.value[0]);
    const sights = ref(sights_list.item);
    const selectedAreaId = ref(sights.value[0].areaId);
    selectedGraph = computed(() => 'graph' + (selectedAreaId.value % 5 + 1));
    const graphFilter = ref('');
    const nodeSearch = ref('');
    const selectedNode = ref('');
    const network = ref(null);
    const maxDistance = ref(100);
    const results = ref([]);
    const selectedTypes = ref([]);

    const filteredGraphs = computed(() => {
        return graphNames.filter(g => g.toLowerCase().includes(graphFilter.value.toLowerCase()));
    });

    const filteredNodes = computed(() => {
        const nodes = graphs[selectedGraph.value];
        return nodeSearch.value ? Object.keys(nodes).filter(node => node.toLowerCase().includes(nodeSearch.value.toLowerCase())) : Object.keys(nodes);
    });

    const allNodeTypes = computed(() => {
        const types = new Set();
        Object.values(graphs[selectedGraph.value]).forEach(node => {
            types.add(node.node_type); // 假设节点的类型信息存储在 node_type 属性中
        });
        return [...types];
    });

    const filteredResults = computed(() => {
        if (!selectedTypes.value.length || selectedTypes.value.includes("")) {
            return results.value;
        }
        return results.value.filter(result => selectedTypes.value.includes(result.type));
    });

    function loadGraph() {
        const nodes = [];
        const edges = [];
        const edgeSet = new Set();  // To prevent adding edges twice
        const graph = graphs[selectedGraph.value];
        for (let node in graph) {
            nodes.push({ id: node, label: node, group: graph[node].node_category });
            graph[node].edges.forEach(edge => {
                const edgeId = node < edge.node ? node + '-' + edge.node : edge.node + '-' + node;
                if (!edgeSet.has(edgeId)) {
                    edges.push({
                        id: edgeId,
                        from: node,
                        to: edge.node,
                        label: String(edge.distance),
                        color: edge.bike_flag ? 'blue' : 'red'
                    });
                    edgeSet.add(edgeId);
                }
            });
        }
        const container = document.getElementById('network-alt');
        const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
        const options = {};
        if (network.value) {
            network.value.destroy();
        }
        network.value = new vis.Network(container, data, options);
        network.value.on("selectNode", function (params) {
            if (params.nodes.length > 0) {
                selectedNode.value = params.nodes[0];
            }
        });
    }

    function filterNodes() {
        selectedNode.value = '';
    }

    function selectNodeFromDropdown() {
        if (network.value && selectedNode.value) {
            const nodeExists = network.value.body.data.nodes.get(selectedNode.value);
            if (nodeExists) {
                highlightSelectedNode(selectedNode.value);
            } else {
                console.error("Node does not exist: ", selectedNode.value);
            }
        } else {
            console.error("Network graph is not initialized or selected node is undefined.");
        }
    }

    function highlightSelectedNode(nodeId) {
        resetNodeColors();
        network.value.body.data.nodes.update({ id: nodeId, color: { border: '#f00', background: '#faa' } });
        network.value.redraw();
    }

    function resetNodeColors() {
        const nodes = network.value.body.data.nodes.get();
        nodes.forEach(node => {
            network.value.body.data.nodes.update({ id: node.id, color: null });
        });
        network.value.redraw();
    }

    function search() {
        results.value = [];
        const targetNode = graphs[selectedGraph.value][selectedNode.value];
        if (targetNode) {
            let nodeDistances = [];
            for (let node in graphs[selectedGraph.value]) {
                if (node !== selectedNode.value) {
                    graphs[selectedGraph.value][node].edges.forEach(edge => {
                        if (edge.node === selectedNode.value && edge.distance <= maxDistance.value) {
                            nodeDistances.push({
                                name: node,
                                distance: edge.distance,
                                type: graphs[selectedGraph.value][node].node_type // 假设节点的类型信息存储在 node_type 属性中
                            });
                        }
                    });
                }
            }
            nodeDistances.sort((a, b) => a.distance - b.distance);
            results.value = nodeDistances.length > 0 ? nodeDistances : [{ name: "No nodes within the specified range.", distance: "-", type: "N/A" }];
        }
    }

    return { graphNames,selectedGraph, graphFilter, filteredGraphs, network, sights,selectedAreaId,maxDistance, results, search, filteredNodes, nodeSearch, selectedNode, allNodeTypes, filteredResults, loadGraph, filterNodes, selectNodeFromDropdown, selectedTypes };
  }
}

const app = createApp({
  components: {
    SearchSurroundings
  }
})

app.mount('#app-surroundings')
