
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
  
  // Process nodes
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
    
    // Process all edges connected to current node
    for (const edge of edges) {
      if (edge.source === currentNode || edge.target === currentNode) {
        // Determine the neighbor node (since edges are bidirectional)
        const neighbor = edge.source === currentNode ? edge.target : edge.source;
        
        // Skip if neighbor has been processed
        if (!unvisited.has(neighbor)) continue;
        
        // Calculate adjusted weight with traffic
        const adjustedWeight = edge.weight * trafficMultiplier;
        
        // Calculate tentative distance through current node
        const tentativeDistance = distances[currentNode] + adjustedWeight;
        
        // Update if tentative distance is shorter
        if (tentativeDistance < distances[neighbor]) {
          distances[neighbor] = tentativeDistance;
          previous[neighbor] = currentNode;
        }
      }
    }
  }
  
  // Reconstruct shortest paths
  const paths: Record<string, string[]> = {};
  
  for (const node of nodes) {
    // Source to itself is a single-node path
    if (node === sourceId) {
      paths[node] = [node];
      continue;
    }
    
    // No path to this node
    if (previous[node] === null || distances[node] === Infinity) {
      paths[node] = [];
      continue;
    }
    
    // Reconstruct path by tracing back through previous nodes
    const path: string[] = [];
    let current: string | null = node;
    
    // Follow the chain of previous nodes
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
  // Validate input parameters
  if (!graph || !graph.nodes || !graph.edges || !sourceId) {
    console.warn("getColoredEdges: Invalid input parameters");
    return [];
  }
  
  // Check if source node exists in the graph
  if (!graph.nodes.some(node => node.id === sourceId)) {
    console.warn(`getColoredEdges: Source node '${sourceId}' not found in graph`);
    return [];
  }
  
  // If destination is provided, check if it exists in the graph
  if (destinationId && !graph.nodes.some(node => node.id === destinationId)) {
    console.warn(`getColoredEdges: Destination node '${destinationId}' not found in graph`);
    destinationId = null; // Reset to null to avoid further issues
  }
  
  try {
    // Get shortest paths using Dijkstra's algorithm
    const { distances, paths } = dijkstra(graph, sourceId, trafficLevel);
    
    // Create a map for edge travel times (adjusted for traffic)
    const edgeWeights: Record<string, number> = {};
    for (const edge of graph.edges) {
      // Create a unique key for each edge (both directions)
      const key1 = `${edge.source}-${edge.target}`;
      const key2 = `${edge.target}-${edge.source}`;
      
      // Apply traffic multiplier to edge weight
      const multiplier = trafficMultipliers[trafficLevel];
      const adjustedWeight = edge.weight * multiplier;
      
      // Store the adjusted travel time
      edgeWeights[key1] = adjustedWeight;
      edgeWeights[key2] = adjustedWeight;
    }
    
    // Create a set to track edges that are on the highlighted path
    const pathEdges = new Set<string>();
    
    // If we have a destination, identify all edges on that path
    if (destinationId && paths[destinationId]?.length > 1) {
      const pathNodes = paths[destinationId];
      
      // Mark each segment along the path
      for (let i = 0; i < pathNodes.length - 1; i++) {
        const source = pathNodes[i];
        const target = pathNodes[i + 1];
        
        // Add both directions to the path set (since edges are bidirectional)
        pathEdges.add(`${source}-${target}`);
        pathEdges.add(`${target}-${source}`);
      }
    }
    
    // Create colored edges for each edge in the graph
    const coloredEdges: ColoredEdge[] = [];
    
    for (const edge of graph.edges) {
      // Check if this edge is on any highlighted path
      const edgeKey1 = `${edge.source}-${edge.target}`;
      const edgeKey2 = `${edge.target}-${edge.source}`;
      const isOnPath = pathEdges.has(edgeKey1) || pathEdges.has(edgeKey2);
      
      // Determine arrival time at the end of this edge
      let arrivalTime = -1;
      let color = "#d1d5db"; // Default color for unused edges
      
      // For edges on the selected path to destination
      if (isOnPath && destinationId) {
        // Get the target node (the one farther from source)
        const sourceDistance = distances[edge.source] || Infinity;
        const targetDistance = distances[edge.target] || Infinity;
        const farther = sourceDistance > targetDistance ? edge.source : edge.target;
        
        // Use the arrival time at the farther node
        arrivalTime = distances[farther];
        if (typeof arrivalTime === 'number' && arrivalTime !== Infinity) {
          color = getColorForTime(arrivalTime);
        }
      } 
      // For edges directly connected to source that aren't on the main path
      else if (edge.source === sourceId || edge.target === sourceId) {
        const neighbor = edge.source === sourceId ? edge.target : edge.source;
        arrivalTime = distances[neighbor];
        if (typeof arrivalTime === 'number' && arrivalTime !== Infinity) {
          color = getColorForTime(arrivalTime);
        }
      }
      
      // Create the colored edge with path information
      const coloredEdge: ColoredEdge = {
        ...edge,
        color: isOnPath ? color : "#d1d5db", // Gray for unused edges
        arrivalTime: isOnPath ? arrivalTime : -1,
        isOnPath: isOnPath
      };
      
      coloredEdges.push(coloredEdge);
    }
    
    return coloredEdges;
  } catch (error) {
    console.error("Error in getColoredEdges:", error);
    return [];
  }
};
