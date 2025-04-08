
import { Graph, Edge, TrafficLevel, trafficMultipliers, ColoredEdge } from './sampleData';

// Dijkstra's Algorithm to calculate shortest paths from source
export const dijkstra = (
  graph: Graph,
  sourceId: string,
  trafficLevel: TrafficLevel = TrafficLevel.Medium
): { distances: Record<string, number>; paths: Record<string, string[]> } => {
  const nodes = graph.nodes.map(node => node.id);
  const edges = graph.edges;
  
  // Initialize data structures
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set(nodes);
  
  // Initialize distances
  for (const node of nodes) {
    distances[node] = node === sourceId ? 0 : Infinity;
    previous[node] = null;
  }
  
  // Traffic multiplier to adjust edge weights
  const trafficMultiplier = trafficMultipliers[trafficLevel];
  
  // Dijkstra's algorithm
  while (unvisited.size > 0) {
    // Find node with minimum distance
    let currentNode: string | null = null;
    let minDistance = Infinity;
    
    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        currentNode = node;
      }
    }
    
    // If all remaining nodes are unreachable, break
    if (currentNode === null || distances[currentNode] === Infinity) {
      break;
    }
    
    // Remove current node from unvisited
    unvisited.delete(currentNode);
    
    // Check neighbors
    for (const edge of edges) {
      // Check edges connected to current node
      if (edge.source === currentNode || edge.target === currentNode) {
        const neighbor = edge.source === currentNode ? edge.target : edge.source;
        
        // Skip if neighbor has been visited
        if (!unvisited.has(neighbor)) continue;
        
        // Calculate adjusted weight with traffic
        const adjustedWeight = edge.weight * trafficMultiplier;
        
        // Calculate tentative distance
        const tentativeDistance = distances[currentNode] + adjustedWeight;
        
        // Update if tentative distance is shorter
        if (tentativeDistance < distances[neighbor]) {
          distances[neighbor] = tentativeDistance;
          previous[neighbor] = currentNode;
        }
      }
    }
  }
  
  // Reconstruct paths
  const paths: Record<string, string[]> = {};
  
  for (const node of nodes) {
    if (node === sourceId) {
      paths[node] = [node];
      continue;
    }
    
    if (previous[node] === null) {
      paths[node] = []; // No path
      continue;
    }
    
    const path: string[] = [];
    let current: string | null = node;
    
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }
    
    paths[node] = path;
  }
  
  return { distances, paths };
};

// Calculate colored edges based on Dijkstra results
// Remove the redefined ColoredEdge interface since we're importing it now
// export interface ColoredEdge extends Edge {
//   color: string;
//   arrivalTime: number;
//   isOnPath?: boolean; // New flag to mark edges on the selected path
// }

export const getColoredEdges = (
  graph: Graph,
  sourceId: string,
  trafficLevel: TrafficLevel,
  getColorForTime: (time: number) => string,
  destinationId: string | null = null
): ColoredEdge[] => {
  // Get shortest paths
  const { distances, paths } = dijkstra(graph, sourceId, trafficLevel);
  
  // Create a map for quick access to edge weights
  const edgeWeights: Record<string, number> = {};
  for (const edge of graph.edges) {
    // Create a key for the edge (both directions)
    const key1 = `${edge.source}-${edge.target}`;
    const key2 = `${edge.target}-${edge.source}`;
    
    // Traffic multiplier
    const multiplier = trafficMultipliers[trafficLevel];
    
    // Store the weighted time
    edgeWeights[key1] = edge.weight * multiplier;
    edgeWeights[key2] = edge.weight * multiplier;
  }
  
  // Create colored edges
  const coloredEdges: ColoredEdge[] = [];
  
  // If we have a destination, we'll only highlight that specific path
  const pathToHighlight = destinationId && paths[destinationId] ? paths[destinationId] : null;
  
  // For each node except the source
  for (const node of graph.nodes) {
    if (node.id === sourceId || !paths[node.id].length) continue;
    
    // Get the path to this node
    const path = paths[node.id];
    
    // For each segment in the path
    for (let i = 0; i < path.length - 1; i++) {
      const source = path[i];
      const target = path[i + 1];
      
      // Calculate arrival time at the target
      const edgeKey = `${source}-${target}`;
      const edgeTime = edgeWeights[edgeKey];
      
      // Time from source to target node
      const arrivalTime = distances[target];
      
      // Find the original edge
      const originalEdge = graph.edges.find(
        e => (e.source === source && e.target === target) || 
             (e.source === target && e.target === source)
      );
      
      if (!originalEdge) continue;
      
      // Check if this edge is on the highlighted path
      const isOnHighlightedPath = pathToHighlight && 
        i < pathToHighlight.length - 1 && 
        pathToHighlight.includes(source) && 
        pathToHighlight.includes(target) &&
        // Make sure they're adjacent in the path
        pathToHighlight.findIndex(id => id === source) === pathToHighlight.findIndex(id => id === target) - 1;
      
      // Only highlight edges that are on the path to the selected destination
      const shouldHighlight = !destinationId || 
        (destinationId && node.id === destinationId) || 
        isOnHighlightedPath;
      
      // Create colored edge
      const coloredEdge: ColoredEdge = {
        source: source,
        target: target,
        weight: originalEdge.weight,
        color: getColorForTime(arrivalTime),
        arrivalTime: arrivalTime,
        isOnPath: shouldHighlight
      };
      
      // Don't add duplicate edges
      const existingEdgeIndex = coloredEdges.findIndex(
        e => (e.source === source && e.target === target) ||
             (e.source === target && e.target === source)
      );
      
      if (existingEdgeIndex === -1) {
        coloredEdges.push(coloredEdge);
      } else if (shouldHighlight) {
        // If this is a highlighted path, it should replace a non-highlighted one
        coloredEdges[existingEdgeIndex] = coloredEdge;
      }
    }
  }
  
  // Add edges not in paths with default color (gray)
  for (const edge of graph.edges) {
    const isInPath = coloredEdges.some(
      e => (e.source === edge.source && e.target === edge.target) ||
           (e.source === edge.target && e.target === edge.source)
    );
    
    if (!isInPath) {
      coloredEdges.push({
        ...edge,
        color: "#d1d5db", // Gray for unused edges
        arrivalTime: -1,
        isOnPath: false
      });
    }
  }
  
  return coloredEdges;
};
