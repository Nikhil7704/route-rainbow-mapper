
import React from 'react';
import { Node, TrafficLevel } from '../utils/sampleData';

interface ResultsPanelProps {
  sourceNodeId: string;
  nodes: Node[];
  distances: Record<string, number>;
  paths: Record<string, string[]>;
  trafficLevel: TrafficLevel;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  sourceNodeId,
  nodes,
  distances,
  paths,
  trafficLevel
}) => {
  // Get source node name
  const sourceNode = nodes.find(node => node.id === sourceNodeId);
  const sourceName = sourceNode ? sourceNode.name : sourceNodeId;
  
  // Get traffic description
  const trafficDescription = {
    [TrafficLevel.Low]: "Low Traffic (0.8x)",
    [TrafficLevel.Medium]: "Medium Traffic (1.0x)",
    [TrafficLevel.High]: "High Traffic (1.5x)"
  }[trafficLevel];
  
  return (
    <div className="bg-white p-5 rounded-lg shadow-md">
      <h3 className="font-semibold text-lg mb-3">Travel Time Results</h3>
      
      <div className="mb-4">
        <p className="text-sm">
          <span className="font-medium">From:</span> {sourceName} ({sourceNodeId})
        </p>
        <p className="text-sm">
          <span className="font-medium">Traffic Conditions:</span> {trafficDescription}
        </p>
      </div>
      
      <div className="space-y-2">
        {nodes
          .filter(node => node.id !== sourceNodeId)
          .sort((a, b) => {
            // Handle undefined or Infinity values in the comparison
            const distA = distances[a.id] === undefined ? Infinity : distances[a.id];
            const distB = distances[b.id] === undefined ? Infinity : distances[b.id];
            return distA - distB;
          })
          .map(node => {
            const distance = distances[node.id];
            const path = paths[node.id];
            const hasPath = path && path.length > 0;
            
            return (
              <div key={node.id} className="border-b pb-2 last:border-b-0">
                <div className="flex justify-between">
                  <span className="font-medium">{node.name} ({node.id})</span>
                  <span className={
                    !distance || distance === Infinity 
                      ? "text-red-500" 
                      : distance > 15 
                        ? "text-red-500" 
                        : distance > 10 
                          ? "text-orange-500" 
                          : distance > 5 
                            ? "text-yellow-500" 
                            : "text-green-500"
                  }>
                    {!distance || distance === Infinity 
                      ? "No path" 
                      : `${typeof distance === 'number' ? distance.toFixed(1) : 'Unknown'} min`}
                  </span>
                </div>
                {hasPath && (
                  <div className="text-xs text-gray-500 mt-1">
                    Path: {path.join(' → ')}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default ResultsPanel;
