
// Defining types for our graph data
export interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface Edge {
  source: string;
  target: string;
  weight: number; // Base travel time in minutes
}

// Add the missing ColoredEdge interface
export interface ColoredEdge extends Edge {
  color: string;
  arrivalTime: number;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

// Sample graph data representing a simple map with locations
export const sampleGraph: Graph = {
  nodes: [
    { id: "A", name: "Downtown", x: 100, y: 300 },
    { id: "B", name: "Airport", x: 300, y: 100 },
    { id: "C", name: "University", x: 500, y: 300 },
    { id: "D", name: "Mall", x: 300, y: 500 },
    { id: "E", name: "Park", x: 700, y: 300 },
    { id: "F", name: "Beach", x: 900, y: 300 },
    { id: "G", name: "Hospital", x: 500, y: 100 },
    { id: "H", name: "Stadium", x: 700, y: 500 }
  ],
  edges: [
    { source: "A", target: "B", weight: 8 },
    { source: "A", target: "D", weight: 7 },
    { source: "B", target: "G", weight: 6 },
    { source: "B", target: "C", weight: 9 },
    { source: "C", target: "E", weight: 5 },
    { source: "C", target: "G", weight: 4 },
    { source: "D", target: "C", weight: 10 },
    { source: "D", target: "H", weight: 16 },
    { source: "E", target: "F", weight: 7 },
    { source: "E", target: "H", weight: 8 },
    { source: "G", target: "E", weight: 12 }
  ]
};

// Traffic multipliers for different traffic conditions
export enum TrafficLevel {
  Low = "low",
  Medium = "medium",
  High = "high"
}

export const trafficMultipliers = {
  [TrafficLevel.Low]: 0.8, // Faster than normal
  [TrafficLevel.Medium]: 1.0, // Normal speed
  [TrafficLevel.High]: 1.5 // Slower due to traffic
};

// Time buckets for color coding (in minutes)
export const timeBuckets = [
  { max: 5, color: "#4ade80" }, // Green: 0-5 minutes
  { max: 10, color: "#facc15" }, // Yellow: 6-10 minutes
  { max: 15, color: "#fb923c" }, // Orange: 11-15 minutes
  { max: Infinity, color: "#ef4444" } // Red: >15 minutes
];

// Function to get color based on time
export const getColorForTime = (time: number): string => {
  for (const bucket of timeBuckets) {
    if (time <= bucket.max) {
      return bucket.color;
    }
  }
  return timeBuckets[timeBuckets.length - 1].color; // Default to last color
};
