
import { Graph, Node, Edge, TrafficLevel } from './sampleData';

// Generate a random number between min and max (inclusive)
const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generate a random position within the canvas bounds
const randomPosition = (width: number, height: number, padding: number = 50) => {
  return {
    x: randomInt(padding, width - padding),
    y: randomInt(padding, height - padding)
  };
};

// Check if two positions are too close
const isTooClose = (pos1: {x: number, y: number}, pos2: {x: number, y: number}, minDistance: number = 100): boolean => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy) < minDistance;
};

// Generate a random node ID (A-Z)
const generateNodeId = (index: number): string => {
  // Start with letters A-Z for first 26 nodes
  if (index < 26) {
    return String.fromCharCode(65 + index);
  }
  // After 26 nodes, use AA, AB, etc.
  return String.fromCharCode(65 + Math.floor(index / 26) - 1) + 
         String.fromCharCode(65 + (index % 26));
};

// Generate random location names
const locationNames = [
  'Downtown', 'Airport', 'University', 'Mall', 'Park', 'Beach', 'Hospital',
  'Stadium', 'Library', 'School', 'Theater', 'Restaurant', 'Office', 'Hotel',
  'Museum', 'Zoo', 'Station', 'Market', 'Factory', 'Warehouse', 'Residential',
  'Plaza', 'Center', 'District', 'Terminal', 'Complex', 'Arena', 'Institute'
];

// Generate a random graph
export const generateRandomGraph = (
  nodeCount: number = 8,
  width: number = 1000,
  height: number = 600,
  connectivityFactor: number = 0.5 // 0-1, higher means more edges
): Graph => {
  const nodes: Node[] = [];
  const positions: {x: number, y: number}[] = [];
  const edges: Edge[] = [];
  
  // Generate nodes
  for (let i = 0; i < nodeCount; i++) {
    let position;
    let attempts = 0;
    
    // Ensure nodes aren't too close together
    do {
      position = randomPosition(width, height);
      attempts++;
    } while (
      positions.some(pos => isTooClose(pos, position)) && 
      attempts < 50
    );
    
    positions.push(position);
    
    const nodeId = generateNodeId(i);
    const locationIndex = randomInt(0, locationNames.length - 1);
    
    nodes.push({
      id: nodeId,
      name: locationNames[locationIndex],
      x: position.x,
      y: position.y
    });
  }
  
  // Generate edges (connections between nodes)
  for (let i = 0; i < nodes.length; i++) {
    // Minimum edges ensure at least one connection per node
    const minEdgesPerNode = 1;
    const maxEdgesPerNode = Math.min(3, nodes.length - 1); // Max 3 connections per node
    const edgeCount = randomInt(minEdgesPerNode, maxEdgesPerNode);
    
    // Create edges
    const connectedNodes = new Set<number>();
    
    for (let j = 0; j < edgeCount; j++) {
      let targetIndex;
      let attempts = 0;
      
      do {
        targetIndex = randomInt(0, nodes.length - 1);
        attempts++;
      } while (
        (targetIndex === i || connectedNodes.has(targetIndex)) && 
        attempts < nodes.length
      );
      
      if (targetIndex !== i && !connectedNodes.has(targetIndex)) {
        connectedNodes.add(targetIndex);
        
        const weight = randomInt(3, 20); // Random travel time between 3-20 minutes
        
        edges.push({
          source: nodes[i].id,
          target: nodes[targetIndex].id,
          weight: weight
        });
      }
    }
  }
  
  // Ensure the graph is connected (each node can reach any other node)
  ensureConnectedGraph(nodes, edges);
  
  return { nodes, edges };
};

// Ensure the graph is fully connected
const ensureConnectedGraph = (nodes: Node[], edges: Edge[]): void => {
  if (nodes.length <= 1) return;
  
  // Use a simple DFS to check connectivity
  const adjacencyList: Record<string, string[]> = {};
  nodes.forEach(node => {
    adjacencyList[node.id] = [];
  });
  
  edges.forEach(edge => {
    adjacencyList[edge.source].push(edge.target);
    adjacencyList[edge.target].push(edge.source); // Bidirectional
  });
  
  // DFS to find connected components
  const visited = new Set<string>();
  
  const dfs = (nodeId: string) => {
    visited.add(nodeId);
    adjacencyList[nodeId].forEach(neighbor => {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    });
  };
  
  // Start DFS from the first node
  dfs(nodes[0].id);
  
  // If not all nodes are reachable, add edges to connect components
  if (visited.size < nodes.length) {
    const unvisited = nodes.filter(node => !visited.has(node.id));
    
    unvisited.forEach(node => {
      // Connect to any visited node
      const targetNode = nodes.find(n => visited.has(n.id));
      if (targetNode) {
        edges.push({
          source: node.id,
          target: targetNode.id,
          weight: randomInt(3, 20)
        });
      }
      
      // Update the visited set
      visited.add(node.id);
    });
  }
};
