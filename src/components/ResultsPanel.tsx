
import React from 'react';
import { Node, TrafficLevel } from '../utils/sampleData';
import { Progress } from '@/components/ui/progress';
import { Timer, MapPin } from 'lucide-react';

interface ResultsPanelProps {
  sourceNodeId: string;
  destinationNodeId: string | null;
  nodes: Node[];
  distances: Record<string, number>;
  paths: Record<string, string[]>;
  trafficLevel: TrafficLevel;
  timeOfDay: number; // 0-23 for hour of day
  onDestinationSelect: (nodeId: string) => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  sourceNodeId,
  destinationNodeId,
  nodes,
  distances,
  paths,
  trafficLevel,
  timeOfDay,
  onDestinationSelect
}) => {
  // Get source node name
  const sourceNode = nodes.find(node => node.id === sourceNodeId);
  const sourceName = sourceNode ? sourceNode.name : sourceNodeId;
  
  // Get destination node name if exists
  const destinationNode = destinationNodeId ? nodes.find(node => node.id === destinationNodeId) : null;
  const destinationName = destinationNode ? destinationNode.name : '';
  
  // Get traffic description
  const trafficDescription = {
    [TrafficLevel.Low]: "Low Traffic (0.8x)",
    [TrafficLevel.Medium]: "Medium Traffic (1.0x)",
    [TrafficLevel.High]: "High Traffic (1.5x)"
  }[trafficLevel];
  
  // Format time of day
  const formattedTime = `${timeOfDay.toString().padStart(2, '0')}:00`;
  const isRushHour = (timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 16 && timeOfDay <= 18);
  
  // Calculate progress for destination if selected
  const progressValue = destinationNodeId && typeof distances[destinationNodeId] === 'number' && distances[destinationNodeId] !== Infinity
    ? Math.min(100, (15 / distances[destinationNodeId]) * 100)
    : 0;
  
  return (
    <div className="bg-white p-5 rounded-lg shadow-md">
      <h3 className="font-semibold text-lg mb-3">Travel Time Results</h3>
      
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-primary" />
          <p className="text-sm">
            <span className="font-medium">From:</span> {sourceName} ({sourceNodeId})
          </p>
        </div>
        
        {destinationNodeId && (
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-red-500" />
            <p className="text-sm">
              <span className="font-medium">To:</span> {destinationName} ({destinationNodeId})
            </p>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Timer size={18} className="text-gray-600" />
          <p className="text-sm">
            <span className="font-medium">Time of Day:</span> {formattedTime}
            {isRushHour && <span className="ml-1 text-xs text-amber-600 font-semibold">(Rush Hour)</span>}
          </p>
        </div>
        
        <p className="text-sm">
          <span className="font-medium">Traffic Conditions:</span> {trafficDescription}
        </p>
      </div>
      
      {destinationNodeId && (
        <div className="mb-5 p-3 bg-gray-50 rounded-md">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Route Speed</span>
            {typeof distances[destinationNodeId] === 'number' && distances[destinationNodeId] !== Infinity && (
              <span className="text-sm font-medium">
                {distances[destinationNodeId].toFixed(1)} min
              </span>
            )}
          </div>
          <Progress value={progressValue} className="h-2" />
          {paths[destinationNodeId] && paths[destinationNodeId].length > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              Path: {paths[destinationNodeId].join(' → ')}
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          {destinationNodeId ? 'All Locations' : 'Select Destination'}
        </h4>
        
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
            const isSelected = node.id === destinationNodeId;
            
            return (
              <div 
                key={node.id} 
                className={`border-b pb-2 last:border-b-0 cursor-pointer transition-colors ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'} p-2 rounded-md`}
                onClick={() => onDestinationSelect(node.id)}
              >
                <div className="flex justify-between">
                  <span className={`font-medium ${isSelected ? 'text-primary' : ''}`}>
                    {node.name} ({node.id})
                  </span>
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
                {hasPath && !isSelected && (
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
