
import React, { useState, useEffect } from 'react';
import GraphVisualization from '../components/GraphVisualization';
import ControlPanel from '../components/ControlPanel';
import Legend from '../components/Legend';
import ResultsPanel from '../components/ResultsPanel';
import { 
  sampleGraph, 
  TrafficLevel, 
  getColorForTime
} from '../utils/sampleData';
import { dijkstra, getColoredEdges } from '../utils/graphAlgorithms';

const Index: React.FC = () => {
  // State for user inputs
  const [sourceNodeId, setSourceNodeId] = useState<string>('A');
  const [trafficLevel, setTrafficLevel] = useState<TrafficLevel>(TrafficLevel.Medium);
  
  // State for computed data
  const [coloredEdges, setColoredEdges] = useState(
    getColoredEdges(sampleGraph, sourceNodeId, trafficLevel, getColorForTime)
  );
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [paths, setPaths] = useState<Record<string, string[]>>({});
  
  // Update visualization when inputs change
  useEffect(() => {
    // Calculate shortest paths and distances
    const { distances, paths } = dijkstra(sampleGraph, sourceNodeId, trafficLevel);
    
    // Get colored edges based on travel times
    const edges = getColoredEdges(sampleGraph, sourceNodeId, trafficLevel, getColorForTime);
    
    // Update state
    setColoredEdges(edges);
    setDistances(distances);
    setPaths(paths);
  }, [sourceNodeId, trafficLevel]);
  
  // Handle node click
  const handleNodeClick = (nodeId: string) => {
    setSourceNodeId(nodeId);
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-gray-800">Route Rainbow Mapper</h1>
        <p className="text-gray-600 mt-2">
          Visualize travel times with color-coded routes
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar with controls */}
        <div className="lg:col-span-1 space-y-6">
          <ControlPanel 
            nodes={sampleGraph.nodes}
            sourceNodeId={sourceNodeId}
            trafficLevel={trafficLevel}
            onSourceNodeChange={setSourceNodeId}
            onTrafficLevelChange={setTrafficLevel}
          />
          
          <Legend />
          
          <ResultsPanel 
            sourceNodeId={sourceNodeId}
            nodes={sampleGraph.nodes}
            distances={distances}
            paths={paths}
            trafficLevel={trafficLevel}
          />
        </div>
        
        {/* Main graph visualization area */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md">
          <GraphVisualization 
            graph={sampleGraph}
            coloredEdges={coloredEdges}
            sourceNodeId={sourceNodeId}
            onNodeClick={handleNodeClick}
          />
        </div>
      </div>
      
      <footer className="mt-8 text-center text-gray-500 text-sm">
        <p>Route Rainbow Mapper - Based on Dijkstra's Algorithm</p>
      </footer>
    </div>
  );
};

export default Index;
