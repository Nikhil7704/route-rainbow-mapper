
import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TrafficLevel } from '../utils/sampleData';
import { MapPin, Clock, Navigation } from 'lucide-react';

interface ControlPanelProps {
  nodes: { id: string; name: string }[];
  sourceNodeId: string;
  trafficLevel: TrafficLevel;
  timeOfDay: number;
  onSourceNodeChange: (nodeId: string) => void;
  onTrafficLevelChange: (level: TrafficLevel) => void;
  onTimeOfDayChange: (time: number) => void;
  isDarkMode?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  nodes,
  sourceNodeId,
  trafficLevel,
  timeOfDay,
  onSourceNodeChange,
  onTrafficLevelChange,
  onTimeOfDayChange,
  isDarkMode = false
}) => {
  // Format time display (24-hour)
  const formatTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };
  
  // Check if current time is rush hour
  const isRushHour = (timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 16 && timeOfDay <= 18);
  
  return (
    <div className={`p-5 rounded-lg shadow-md flex flex-col gap-5 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
      <div>
        <h3 className={`font-semibold text-lg mb-3 flex items-center ${isDarkMode ? 'text-white' : ''}`}>
          <MapPin className={`mr-2 ${isDarkMode ? 'text-primary' : 'text-primary'}`} size={20} />
          Starting Location
        </h3>
        <Select 
          value={sourceNodeId} 
          onValueChange={onSourceNodeChange}
        >
          <SelectTrigger className={`w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
            <SelectValue placeholder="Select source node" />
          </SelectTrigger>
          <SelectContent className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
            {nodes.map(node => (
              <SelectItem key={node.id} value={node.id}>
                {node.name} ({node.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className={`font-semibold text-lg mb-3 flex items-center ${isDarkMode ? 'text-white' : ''}`}>
          <Clock className={`mr-2 ${isDarkMode ? 'text-primary' : 'text-primary'}`} size={20} />
          Time of Day
        </h3>
        <div className="px-1">
          <div className="flex justify-between mb-2">
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>0:00</span>
            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : ''}`}>
              {formatTime(timeOfDay)}
              {isRushHour && 
                <span className="ml-1 text-xs text-amber-500 font-semibold">(Rush Hour)</span>
              }
            </span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>23:00</span>
          </div>
          <Slider
            value={[timeOfDay]}
            min={0}
            max={23}
            step={1}
            onValueChange={(value) => onTimeOfDayChange(value[0])}
            className={isDarkMode ? 'bg-gray-700' : ''}
          />
          <div className="flex justify-between mt-1">
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Night</span>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Day</span>
            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Night</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className={`font-semibold text-lg mb-3 flex items-center ${isDarkMode ? 'text-white' : ''}`}>
          <Navigation className={`mr-2 ${isDarkMode ? 'text-primary' : 'text-primary'}`} size={20} />
          Traffic Conditions
        </h3>
        <Select 
          value={trafficLevel} 
          onValueChange={(value) => onTrafficLevelChange(value as TrafficLevel)}
        >
          <SelectTrigger className={`w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
            <SelectValue placeholder="Select traffic level" />
          </SelectTrigger>
          <SelectContent className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
            <SelectItem value={TrafficLevel.Low}>Low Traffic (0.8x)</SelectItem>
            <SelectItem value={TrafficLevel.Medium}>Medium Traffic (1.0x)</SelectItem>
            <SelectItem value={TrafficLevel.High}>High Traffic (1.5x)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>Click on any node to set it as the destination.</p>
      </div>
    </div>
  );
};

export default ControlPanel;
