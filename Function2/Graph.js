class Graph {
    constructor() {
        this.adjacencyList = {};
        this.nodeCount = {};
    }

    addVertex(node_name, node_category, node_type) {
        if (!this.adjacencyList[node_name]) {
            this.adjacencyList[node_name] = {
                edges: [],
                node_category,
                node_type,
                node_degree: 0
            };
            if (!this.nodeCount[node_type]) {
                this.nodeCount[node_type] = 0;
            }
            this.nodeCount[node_type]++;
        }
    }

    addRandomEdge(node1, node2) {
        const distance = Math.floor(Math.random() * (1001 - 50) + 50);
        const bike_flag = Math.random() < 0.6;
        const Pcongestion = Math.random() < 0.8 ? Math.random() * 0.35 : 0.35 + Math.random() * 0.6;
        const Bcongestion = bike_flag ? (Math.random() < 0.7 ? Math.random() * 0.4 : 0.4 + Math.random() * 0.5) : 1;

        this.addEdge(node1, node2, distance, bike_flag, Pcongestion, Bcongestion);
    }

    addEdge(node1, node2, distance, bike_flag, Pcongestion, Bcongestion) {
        let walk_speed = this.WSPEED * (1 - Pcongestion);
        let walk_time = distance / walk_speed;
        let ride_time;

        if (bike_flag) {
            let ride_speed = this.RSPEED * (1 - Bcongestion);
            ride_time = distance / ride_speed;
        } else {
            ride_time = -1;  // 表示不可通行
        }

        if (this.adjacencyList[node1] && this.adjacencyList[node2]) {
            this.adjacencyList[node1].edges.push({
                node: node2,
                distance,
                bike_flag,
                congestion: {
                    Pcongestion,
                    Bcongestion
                },
                time: {
                    walk_time,
                    ride_time
                }
            });
            this.adjacencyList[node2].edges.push({
                node: node1,
                distance,
                bike_flag,
                congestion: {
                    Pcongestion,
                    Bcongestion
                },
                time: {
                    walk_time,
                    ride_time
                }
            });

            // Increment node degrees
            this.adjacencyList[node1].node_degree++;
            this.adjacencyList[node2].node_degree++;
        }
    }
}

// 创建图实例
const schoolGraph = new Graph();

// 生成节点
function generateNodes(graph, counts, typePrefix, category, types) {
    types.forEach((type, index) => {
        for (let i = 1; i <= counts[index]; i++) {
            let node_name = `${type}${i}`;
            graph.addVertex(node_name, category, type);
        }
    });
}

// 根据给定的规则生成节点
const buildingCounts = [1, 3, 6, 10]; // 风景点, 办公楼, 教学楼, 宿舍楼
const facilityCounts = [1, 2, 2, 3, 4, 5, 6, 7, 10, 10]; // 体育馆到商店

generateNodes(schoolGraph, buildingCounts, "Building", "大型建筑物", ["景点", "办公楼", "教学楼", "宿舍楼"]);
generateNodes(schoolGraph, facilityCounts, "Facility", "服务类设施", ["体育馆", "图书馆", "浴室", "超市", "水房", "咖啡馆", "饭店", "食堂", "洗手间", "商店"]);
generateNodes(schoolGraph, [30], "Crossing", "交叉路口", ["交叉路口"]);

// 随机连接节点
const allNodes = Object.keys(schoolGraph.adjacencyList);
allNodes.forEach(node => {
    let possibleConnections = allNodes.filter(n => n !== node && schoolGraph.adjacencyList[n].node_degree < 4);
    let numConnections = Math.floor(Math.random() * 5); // 最多4个连接

    for (let i = 0; i < numConnections && possibleConnections.length > 0; i++) {
        let target = possibleConnections[Math.floor(Math.random() * possibleConnections.length)];
        schoolGraph.addRandomEdge(node, target);
        possibleConnections = possibleConnections.filter(n => n !== target && schoolGraph.adjacencyList[n].node_degree < 4);
    }
});
