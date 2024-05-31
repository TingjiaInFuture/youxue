const fs = require('fs');

class Graph {
    constructor() {
        this.adjacencyList = {};
        this.nodeCount = {};
        this.WSPEED = 1.4;
        this.RSPEED = 4.9;
    }

    addVertex(node_name, node_category, node_type) {
        if (!this.adjacencyList[node_name]) {
            this.adjacencyList[node_name] = {
                edges: [],
                node_category,
                node_type,
                node_degree: 0
            };
        }
    }

    addRandomEdge(node1, node2) {
        const distance = Math.floor(Math.random() * (951) + 50);
        const bike_flag = Math.random() < 0.6;
        const Pcongestion = Math.random() < 0.8 ? parseFloat((Math.random() * 0.35).toFixed(2)) : parseFloat((Math.random() * 0.6 + 0.35).toFixed(2));
        const Bcongestion = bike_flag ? (Math.random() < 0.7 ? parseFloat((Math.random() * 0.4).toFixed(2)) : parseFloat((Math.random() * 0.5 + 0.4).toFixed(2))) : 1;

        this.addEdge(node1, node2, distance, bike_flag, Pcongestion, Bcongestion);
    }

    addEdge(node1, node2, distance, bike_flag, Pcongestion, Bcongestion) {
        let walk_speed = parseFloat((this.WSPEED * (1 - Pcongestion)).toFixed(2));
        let walk_time = parseFloat((distance / walk_speed).toFixed(2));
        let ride_time;

        if (bike_flag) {
            let ride_speed = parseFloat((this.RSPEED * (1 - Bcongestion)).toFixed(2));
            ride_time = parseFloat((distance / ride_speed).toFixed(2));
        } else {
            ride_time = -1;  // 表示不可通行
        }

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

        // 增加节点的度数
        this.adjacencyList[node1].node_degree++;
        this.adjacencyList[node2].node_degree++;
    }
    

    generateGraph() {
        const types = {
            "building": ["scenic_spot", "administration_building", "teaching_building", "dormitory_building"],
            "facility": ["store", "restaurant", "toilet", "library", "canteen", "supermarket", "coffee_shop", "water_room", "bathhouse", "gym"],
            "crossing": ["the_crossing"]
        };
        const counts = {
            "building": [1, 3, 6, 10],  // 风景点, 办公楼, 教学楼, 宿舍楼
            "facility": [1, 2, 2, 3, 4, 5, 6, 7, 10, 10],  // 体育馆到商店
            "crossing": [30]  // 交叉路口
        };

        Object.keys(types).forEach(category => {
            types[category].forEach((type, index) => {
                for (let i = 0; i < counts[category][index]; i++) {
                    let node_name = `${type}${i + 1}`;
                    this.addVertex(node_name, category, type);
                }
            });
        });

        const allNodes = Object.keys(this.adjacencyList);
        allNodes.forEach(node => {
            let possibleConnections = allNodes.filter(n => n !== node && this.adjacencyList[n].node_degree < 4);
            let numConnections = Math.floor(Math.random() * Math.min(5, possibleConnections.length));
            for (let i = 0; i < numConnections; i++) {
                let target = possibleConnections.splice(Math.floor(Math.random() * possibleConnections.length), 1)[0];
                this.addRandomEdge(node, target);
            }
        });
    }
}

function generateGraphsAndSave() {
    for (let i = 0; i < 5; i++) {
        const graph = new Graph();
        graph.generateGraph();
        const content = `const graphData = ${JSON.stringify(graph.adjacencyList, null, 2)};\nmodule.exports = graphData;`;
        fs.writeFileSync(`./graph${i + 1}.js`, content, 'utf8');
    }
}

generateGraphsAndSave();
