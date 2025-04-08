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
  
  // Create a set of edges that are on the highlighted path
  const pathEdges = new Set<string>();
  
  // If we have a destination, mark all edges on that path
  if (destinationId && paths[destinationId]?.length > 0) {
    const pathToHighlight = paths[destinationId];
    
    // Mark edges on the path
    for (let i = 0; i < pathToHighlight.length - 1; i++) {
      const source = pathToHighlight[i];
      const target = pathToHighlight[i + 1];
      
      // Add both directions to the set (we don't know which way the edge is stored)
      pathEdges.add(`${source}-${target}`);
      pathEdges.add(`${target}-${source}`);
    }
  }
  
  // For each edge, determine if it's on the path
  for (const edge of graph.edges) {
    const edgeKey1 = `${edge.source}-${edge.target}`;
    const edgeKey2 = `${edge.target}-${edge.source}`;
    
    const isOnHighlightedPath = pathEdges.has(edgeKey1) || pathEdges.has(edgeKey2);
    
    // Determine the color and arrival time for this edge
    let color = "#d1d5db"; // Default gray for unused edges
    let arrivalTime = -1;
    
    // If the edge connects to the source, calculate arrival time
    if (edge.source === sourceId || edge.target === sourceId) {
      const neighbor = edge.source === sourceId ? edge.target : edge.source;
      arrivalTime = distances[neighbor];
      color = getColorForTime(arrivalTime);
    } 
    // If the edge is part of a path but not connected to source
    else if (isOnHighlightedPath && destinationId) {
      // Find where this edge occurs in the path
      const path = paths[destinationId];
      for (let i = 0; i < path.length - 1; i++) {
        const source = path[i];
        const target = path[i + 1];
        
        if ((edge.source === source && edge.target === target) || 
            (edge.source === target && edge.target === source)) {
          // For paths, use the arrival time at the target node
          arrivalTime = distances[target];
          color = getColorForTime(arrivalTime);
          break;
        }
      }
    }
    
    // Create the colored edge
    const coloredEdge: ColoredEdge = {
      ...edge,
      color: isOnHighlightedPath ? color : "#d1d5db", // Gray for unused edges
      arrivalTime: arrivalTime,
      isOnPath: isOnHighlightedPath
    };
    
    coloredEdges.push(coloredEdge);
  }
  
  return coloredEdges;
};
