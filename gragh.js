const fs = require('fs');
class PriorityQueue {
    constructor() {
        this.queue = [];
    }

    enqueue(node, priority) {
        this.queue.push({node, priority});
        this.queue.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.queue.shift().node;
    }

    isEmpty() {
        return !this.queue.length;
    }
}

class MultiGraph {
    constructor() {
        this.nodes = {};
    }

    addNode(node) {
        this.nodes[node] = this.nodes[node] || { edges: [] };
    }

    addEdge(node1, node2, weight = 1) {
        this.addNode(node1);
        this.addNode(node2);
        this.nodes[node1].edges.push({ node: node2, weight: weight });
        this.nodes[node2].edges.push({ node: node1, weight: weight });
    }


    saveToFile(filename) {
        fs.writeFileSync(filename, JSON.stringify(this.nodes));
    }

    shortestPath(startNode, endNode) {
        let distances = {};
        let previousNodes = {};
        let queue = new PriorityQueue();
    
        // Initialization
        for (let node in this.nodes) {
            distances[node] = node === startNode ? 0 : Infinity;
            previousNodes[node] = null;
            queue.enqueue(node, distances[node]);
        }
    
        while (!queue.isEmpty()) {
            let currentNode = queue.dequeue();
    
            for (let edge of this.nodes[currentNode].edges) {
                let neighbor = edge.node;
                let distanceToNeighbor = distances[currentNode] + edge.weight;
    
                if (distanceToNeighbor < distances[neighbor]) {
                    distances[neighbor] = distanceToNeighbor;
                    previousNodes[neighbor] = currentNode;
                    queue.enqueue(neighbor, distanceToNeighbor);
                }
            }
        }
    
        // Return shortest path
        let path = [];
        let currentNode = endNode;
    
        while (currentNode !== null) {
            path.unshift(currentNode);
            currentNode = previousNodes[currentNode];
        }
    
        return path;
    }
    



}

let g = new MultiGraph();
g.addEdge('A', 'B', 1);
g.addEdge('A', 'B', 2);
g.addEdge('A', 'C', 1);

g.addEdge('A', 'E', 4);
g.addEdge('E', 'F', 1);
g.addEdge('F', 'D', 1);

g.addEdge('A', 'G', 2);
g.addEdge('G', 'H', 2);
g.addEdge('H', 'D', 2);
g.saveToFile('graph.json');
console.log(g.shortestPath('A', 'D')); 
