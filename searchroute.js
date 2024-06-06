const { createApp, ref, computed, watch } = Vue
import graph1 from './json/graph1.js';
import graph2 from './json/graph2.js';
import graph3 from './json/graph3.js';
import graph4 from './json/graph4.js';
import graph5 from './json/graph5.js';
import sights_list from './json/SightsInfo.js';
const graphs = { graph1, graph2, graph3, graph4, graph5 };
const SearchRoutes = {
  template: `
  <div class="app-route">
  <h1 class="route_title">游学路线规划</h1>
  <div class="selector-wrapper">
  <select v-model="selectedAreaId" @change="loadGraph">
    <option v-for="sight in sights" :value="sight.areaId">{{ sight.nameSight }}</option>
  </select>
  <button id="writeButton" class="btn btn-info" @click="towrite"><i class="fas fa-pen"></i></button>
</div>
<div class="selector-wrapper">
  <input type="text" v-model="startNodeSearch" placeholder="请输入出发地点...">
  <select v-model="selectedStartNode" @change="highlightStartNode">
      <option v-for="node in filteredStartNodes" :value="node">{{ node }}</option>
  </select>
  <input type="text" v-model="endNodeSearch" placeholder="请输入目的地点...">
  <select v-model="selectedEndNode" @change="highlightEndNode">
      <option v-for="node in filteredEndNodes" :value="node">{{ node }}</option>
  </select>
</div>
<div class="selector-wrapper">
  <button @click="toggleWaypointMode">{{ waypointMode ? '退出途径地点选择模式' : '点击选择途径地点' }}</button>
  <p v-if="waypointMode" class="highlighted">进入途径地点选择模式</p>
  <p v-else class="highlighted">未进入途径地点选择模式</p>
</div>
<div class="selector-wrapper">
  <p>已选中的途径地点:</p>
  <ul>
      <li v-for="(waypoint, index) in selectedWaypoints" :key="waypoint" class="waypoint-item">
          {{ waypoint }}
          <button @click="removeWaypoint(index)">取消选中</button>
      </li>
  </ul>
</div>
<div id="network"></div>
<div class="selector-wrapper">
  <select v-model="selectedStrategy">
      <option value="distance">最短距离策略</option>
      <option value="time">最短时间策略</option>
  </select>
  <select v-model="selectedTransport" v-if="selectedStrategy === 'time'">
      <option value="walk">步行</option>
      <option value="bike">使用交通工具</option>
  </select>
</div>
<button @click="planRoute">规划路线</button>
<div id="results">
  <h2>规划路线结果</h2>
  <div v-if="route.length > 0">
      <div v-for="(node, index) in route" :key="node" class="result-item">
          {{ index + 1 }}. 地点名称：{{ node }}
      </div>
  </div>
  <div v-else class="no-results">
      在当前条件下没有结果
  </div>
  </div>
  <div id="statistics" class="selector-wrapper">
      <h2>统计信息</h2>
      <p>从出发点到目的地的总计距离：{{ totalDistance }} 米</p>
      <p v-if="selectedStrategy === 'time'">从出发点到目的地的总计时间：{{ (totalTime / 60).toFixed(2) }} 分钟</p>
      <p v-if="selectedStrategy === 'time' && selectedTransport === 'bike'">使用交通工具的时间：{{ (totalRideTime / 60).toFixed(2) }} 分钟</p>
      <p v-if="selectedStrategy === 'time' && selectedTransport === 'bike'">总步行时间：{{ (totalWalkTime / 60).toFixed(2) }} 分钟</p>
  </div>
  </div>
  `,
  setup() {
    const graphNames = ref(['graph1', 'graph2', 'graph3', 'graph4', 'graph5']);
    let selectedGraph = ref(graphNames.value[0]);
    const sights = ref(sights_list.item);
    const selectedAreaId = ref(sights.value[0].areaId);
    let selectedAreaName = ref(sights.value[0].nameSight);
    selectedAreaName = computed(() => {
        if (sights.value[selectedAreaId.value]) {
            return sights.value[selectedAreaId.value-6].nameSight;
        } else {
            return '';
        }
    });
    selectedGraph = computed(() => 'graph' + (selectedAreaId.value % 5 + 1));
    const startNodeSearch = ref('');
    const endNodeSearch = ref('');
    const selectedStartNode = ref('');
    const selectedEndNode = ref('');
    const selectedStrategy = ref('distance');
    const selectedTransport = ref('walk');
    const network = ref(null);
    const route = ref([]);
    const totalDistance = ref(0);
    const totalTime = ref(0);
    const totalRideTime = ref(0);
    const totalWalkTime = ref(0);
    const waypointMode = ref(false);
    const selectedWaypoints = ref([]);
    let previousHighlightedEdges = [];
    let previousEndNode = null;
    const towrite = () => {
        window.towrite(selectedAreaName.value);
    }
            watch(selectedStartNode, () => highlightStartNode());
            watch(selectedEndNode, () => highlightEndNode());

            const filteredStartNodes = computed(() => {
                const nodes = graphs[selectedGraph.value];
                return startNodeSearch.value ? Object.keys(nodes).filter(node => node.toLowerCase().includes(startNodeSearch.value.toLowerCase())) : Object.keys(nodes);
            });

            const filteredEndNodes = computed(() => {
                const nodes = graphs[selectedGraph.value];
                return endNodeSearch.value ? Object.keys(nodes).filter(node => node.toLowerCase().includes(endNodeSearch.value.toLowerCase())) : Object.keys(nodes);
            });

            function loadGraph() {
                const nodes = [];
                const edges = [];
                const edgeSet = new Set();  // 防止重复添加边
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
                const container = document.getElementById('network');
                const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
                const options = {};
                if (network.value) {
                    network.value.destroy();
                }
                network.value = new vis.Network(container, data, options);
                network.value.on("click", function (params) {
                    if (waypointMode.value) {
                        if (params.nodes.length > 0) {
                            const clickedNode = params.nodes[0];
                            if (selectedWaypoints.value.includes(clickedNode)) {
                                selectedWaypoints.value = selectedWaypoints.value.filter(node => node !== clickedNode);
                            } else {
                                selectedWaypoints.value.push(clickedNode);
                            }
                        }
                    } else {
                        if (params.nodes.length > 0) {
                            const clickedNode = params.nodes[0];
                            selectedStartNode.value = clickedNode;
                        }
                    }
                });
                network.value.on("oncontext", function (params) {
                    params.event.preventDefault();
                    if (!waypointMode.value) {
                        const pointer = params.pointer;
                        const clickedNode = network.value.getNodeAt(pointer.DOM);
                        if (clickedNode) {
                            if (previousEndNode) {
                                network.value.body.data.nodes.update({ id: previousEndNode, color: { border: '#2B7CE9' } });
                            }
                            selectedEndNode.value = clickedNode;
                            previousEndNode = clickedNode;
                        }
                    }
                });
            }

            function toggleWaypointMode() {
                waypointMode.value = !waypointMode.value;
            }

            function highlightStartNode() {
                if (network.value && selectedStartNode.value) {
                    network.value.body.data.nodes.update({ id: selectedStartNode.value, color: { border: 'black' } });
                    network.value.redraw();
                }
            }

            function highlightEndNode() {
                if (network.value && selectedEndNode.value) {
                    network.value.body.data.nodes.update({ id: selectedEndNode.value, color: { border: 'black' } });
                    network.value.redraw();
                }
            }

            function planRoute() {
                const graph = graphs[selectedGraph.value];
                const start = selectedStartNode.value;
                const end = selectedEndNode.value;
                const waypoints = selectedWaypoints.value;

                if (!start || !end) return;

                let fullPath = [];
                totalDistance.value = 0;
                totalTime.value = 0;
                totalRideTime.value = 0;
                totalWalkTime.value = 0;

                function calculatePath(from, to) {
                    const nodes = new Set(Object.keys(graph));
                    const distances = {};
                    const times = {};
                    const previous = {};

                    nodes.forEach(node => {
                        distances[node] = Infinity;
                        times[node] = Infinity;
                        previous[node] = null;
                    });

                    distances[from] = 0;
                    times[from] = 0;

                    while (nodes.size) {
                        const closestNode = [...nodes].reduce((minNode, node) =>
                            selectedStrategy.value === 'distance' ?
                            (distances[node] < distances[minNode] ? node : minNode) :
                            (times[node] < times[minNode] ? node : minNode)
                        , [...nodes][0]);

                        if (closestNode === to) break;

                        nodes.delete(closestNode);

                        graph[closestNode].edges.forEach(edge => {
                            const altDist = distances[closestNode] + edge.distance;
                            let altTime;
                            if (selectedTransport.value === 'walk') {
                                altTime = times[closestNode] + edge.time.walk_time;
                            } else {
                                altTime = times[closestNode] + (edge.time.ride_time === -1 ? edge.time.walk_time : Math.min(edge.time.walk_time, edge.time.ride_time));
                            }

                            if (selectedStrategy.value === 'distance' && altDist < distances[edge.node]) {
                                distances[edge.node] = altDist;
                                previous[edge.node] = closestNode;
                            } else if (selectedStrategy.value === 'time' && altTime < times[edge.node]) {
                                times[edge.node] = altTime;
                                previous[edge.node] = closestNode;
                            }
                        });
                    }

                    const path = [];
                    let currentNode = to;

                    while (currentNode) {
                        path.unshift(currentNode);
                        currentNode = previous[currentNode];
                    }

                    return { path, distances, times };
                }

                function findBestPath(start, end, waypoints) {
                    if (waypoints.length === 0) {
                        return calculatePath(start, end).path;
                    }

                    const permutations = permute(waypoints);
                    let bestPath = [];
                    let bestDistance = Infinity;
                    let bestTime = Infinity;

                    permutations.forEach(perm => {
                        let currentPath = [];
                        let currentDistance = 0;
                        let currentTime = 0;
                        let valid = true;

                        let prevNode = start;
                        for (let waypoint of perm) {
                            const { path: segment, distances, times } = calculatePath(prevNode, waypoint);
                            if (segment.length === 0) {
                                valid = false;
                                break;
                            }
                            currentPath = currentPath.concat(segment.slice(0, -1));
                            currentDistance += distances[waypoint];
                            currentTime += times[waypoint];
                            prevNode = waypoint;
                        }

                        const { path: finalSegment, distances: finalDistances, times: finalTimes } = calculatePath(prevNode, end);
                        if (finalSegment.length === 0) {
                            valid = false;
                        }

                        if (valid) {
                            currentPath = currentPath.concat(finalSegment);
                            currentDistance += finalDistances[end];
                            currentTime += finalTimes[end];

                            if (selectedStrategy.value === 'distance' && currentDistance < bestDistance) {
                                bestDistance = currentDistance;
                                bestPath = currentPath;
                            } else if (selectedStrategy.value === 'time' && currentTime < bestTime) {
                                bestTime = currentTime;
                                bestPath = currentPath;
                            }
                        }
                    });

                    totalDistance.value = bestDistance;
                    totalTime.value = bestTime;
                    return bestPath;
                }

                const permute = (arr) => {
                    if (arr.length <= 1) return [arr];
                    const result = [];
                    for (let i = 0; i < arr.length; i++) {
                        const rest = permute(arr.slice(0, i).concat(arr.slice(i + 1)));
                        rest.forEach(r => result.push([arr[i]].concat(r)));
                    }
                    return result;
                };

                const bestPath = findBestPath(start, end, waypoints);
                route.value = bestPath;

                // Recalculate times based on the final path
                totalDistance.value = 0;
                totalTime.value = 0;
                totalRideTime.value = 0;
                totalWalkTime.value = 0;
                for (let i = 0; i < bestPath.length - 1; i++) {
                    const from = bestPath[i];
                    const to = bestPath[i + 1];
                    const edge = graph[from].edges.find(e => e.node === to);

                    totalDistance.value += edge.distance;
                    if (selectedTransport.value === 'walk' || edge.time.ride_time === -1) {
                        totalWalkTime.value += edge.time.walk_time;
                    } else {
                        totalRideTime.value += edge.time.ride_time;
                    }
                }
                totalTime.value = totalWalkTime.value + totalRideTime.value;

                resetEdgeColors();
                highlightPath(route.value);
            }

            function resetEdgeColors() {
                if (network.value && previousHighlightedEdges.length > 0) {
                    const edges = network.value.body.data.edges.get();
                    previousHighlightedEdges.forEach(edgeId => {
                        const edge = edges.find(e => e.id === edgeId);
                        if (edge) {
                            edge.color = edge.bike_flag ? 'blue' : 'red';
                            edge.width = 1;
                        }
                    });
                    network.value.body.data.edges.update(edges);
                    previousHighlightedEdges = [];
                }
            }

            function highlightPath(path) {
                if (network.value) {
                    const edges = network.value.body.data.edges.get();
                    const updateEdges = edges.map(edge => {
                        if (path.includes(edge.from) && path.includes(edge.to)) {
                            previousHighlightedEdges.push(edge.id);
                            return { ...edge, color: { color: 'black' }, width: 3 };
                        } else {
                            return edge;
                        }
                    });
                    network.value.body.data.edges.update(updateEdges);

                    path.forEach((node, index) => {
                        if (index === 0 || index === path.length - 1) {
                            network.value.body.data.nodes.update({ id: node, color: { border: 'black' } });
                        } else {
                            network.value.body.data.nodes.update({ id: node, color: { border: 'green' } });
                        }
                    });
                }
            }

            function removeWaypoint(index) {
                selectedWaypoints.value.splice(index, 1);
            }

            return {
                graphNames, selectedGraph, network, startNodeSearch, endNodeSearch,sights,selectedAreaId,
                selectedStartNode, selectedEndNode, selectedStrategy, selectedTransport,selectedAreaName,
                filteredStartNodes, filteredEndNodes, loadGraph, highlightStartNode,
                highlightEndNode, planRoute, route, totalDistance, totalTime, totalRideTime, totalWalkTime,
                waypointMode, toggleWaypointMode, selectedWaypoints, removeWaypoint,towrite
            };
  }
}

const app = createApp({
  components: {
    SearchRoutes
  }
})

app.mount('#app-route')
