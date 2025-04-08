
import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrafficLevel } from '../utils/sampleData';
import { MapPin, Navigation } from 'lucide-react';

interface ControlPanelProps {
  nodes: { id: string; name: string }[];
  sourceNodeId: string;
  trafficLevel: TrafficLevel;
  onSourceNodeChange: (nodeId: string) => void;
  onTrafficLevelChange: (level: TrafficLevel) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  nodes,
  sourceNodeId,
  trafficLevel,
  onSourceNodeChange,
  onTrafficLevelChange
}) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md flex flex-col gap-5">
      <div>
        <h3 className="font-semibold text-lg mb-3 flex items-center">
          <MapPin className="mr-2" size={20} />
          Starting Location
        </h3>
        <Select 
          value={sourceNodeId} 
          onValueChange={onSourceNodeChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select source node" />
          </SelectTrigger>
          <SelectContent>
            {nodes.map(node => (
              <SelectItem key={node.id} value={node.id}>
                {node.name} ({node.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-3 flex items-center">
          <Navigation className="mr-2" size={20} />
          Traffic Conditions
        </h3>
        <Select 
          value={trafficLevel} 
          onValueChange={(value) => onTrafficLevelChange(value as TrafficLevel)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select traffic level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TrafficLevel.Low}>Low Traffic (0.8x)</SelectItem>
            <SelectItem value={TrafficLevel.Medium}>Medium Traffic (1.0x)</SelectItem>
            <SelectItem value={TrafficLevel.High}>High Traffic (1.5x)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Click on any node to set it as the starting location.</p>
      </div>
    </div>
  );
};

export default ControlPanel;
