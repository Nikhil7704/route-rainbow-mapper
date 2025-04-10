
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
  isDarkMode?: boolean;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({
  sourceNodeId,
  destinationNodeId,
  nodes,
  distances,
  paths,
  trafficLevel,
  timeOfDay,
  onDestinationSelect,
  isDarkMode = false
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
    <div className={`p-5 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800 border border-gray-700 text-white' : 'bg-white'}`}>
      <h3 className={`font-semibold text-lg mb-3 ${isDarkMode ? 'text-white' : ''}`}>Travel Time Results</h3>
      
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-primary" />
          <p className={`text-sm ${isDarkMode ? 'text-gray-200' : ''}`}>
            <span className="font-medium">From:</span> {sourceName} ({sourceNodeId})
          </p>
        </div>
        
        {destinationNodeId && (
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-red-500" />
            <p className={`text-sm ${isDarkMode ? 'text-gray-200' : ''}`}>
              <span className="font-medium">To:</span> {destinationName} ({destinationNodeId})
            </p>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Timer size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
          <p className={`text-sm ${isDarkMode ? 'text-gray-200' : ''}`}>
            <span className="font-medium">Time of Day:</span> {formattedTime}
            {isRushHour && <span className="ml-1 text-xs text-amber-500 font-semibold">(Rush Hour)</span>}
          </p>
        </div>
        
        <p className={`text-sm ${isDarkMode ? 'text-gray-200' : ''}`}>
          <span className="font-medium">Traffic Conditions:</span> {trafficDescription}
        </p>
      </div>
      
      {destinationNodeId && (
        <div className={`mb-5 p-3 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex justify-between mb-1">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : ''}`}>Route Speed</span>
            {typeof distances[destinationNodeId] === 'number' && distances[destinationNodeId] !== Infinity && (
              <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : ''}`}>
                {distances[destinationNodeId].toFixed(1)} min
              </span>
            )}
          </div>
          <Progress value={progressValue} className="h-2" />
          {paths[destinationNodeId] && paths[destinationNodeId].length > 0 && (
            <div className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Path: {paths[destinationNodeId].join(' → ')}
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-2">
        <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
                className={`border-b pb-2 last:border-b-0 cursor-pointer transition-colors 
                  ${isDarkMode 
                    ? isSelected ? 'bg-gray-700 border-gray-600' : 'hover:bg-gray-700 border-gray-700' 
                    : isSelected ? 'bg-gray-50' : 'hover:bg-gray-50 border-gray-200'
                  } 
                  p-2 rounded-md`}
                onClick={() => onDestinationSelect(node.id)}
              >
                <div className="flex justify-between">
                  <span className={`font-medium ${isSelected ? 'text-primary' : isDarkMode ? 'text-white' : ''}`}>
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
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
