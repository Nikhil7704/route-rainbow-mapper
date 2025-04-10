
import React, { useState, useEffect } from 'react';
import GraphVisualization from '../components/GraphVisualization';
import ControlPanel from '../components/ControlPanel';
import Legend from '../components/Legend';
import ResultsPanel from '../components/ResultsPanel';
import { 
  TrafficLevel, 
  getColorForTime,
  Graph
} from '../utils/sampleData';
import { dijkstra, getColoredEdges } from '../utils/graphAlgorithms';
import { generateRandomGraph } from '../utils/graphGenerator';

const Index: React.FC = () => {
  // Graph generation controls
  const [nodeCount, setNodeCount] = useState<number>(8);
  const [randomGraph, setRandomGraph] = useState<Graph>(generateRandomGraph(nodeCount));
  
  // State for user inputs
  const [sourceNodeId, setSourceNodeId] = useState<string>(randomGraph.nodes[0]?.id || 'A');
  const [destinationNodeId, setDestinationNodeId] = useState<string | null>(null);
  const [trafficLevel, setTrafficLevel] = useState<TrafficLevel>(TrafficLevel.Medium);
  const [timeOfDay, setTimeOfDay] = useState<number>(12); // Default to noon
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // State for computed data
  const [coloredEdges, setColoredEdges] = useState(
    getColoredEdges(randomGraph, sourceNodeId, trafficLevel, getColorForTime, null)
  );
  const [distances, setDistances] = useState<Record<string, number>>({});
  const [paths, setPaths] = useState<Record<string, string[]>>({});
  
  // Generate a new random graph
  const handleGenerateGraph = () => {
    const newGraph = generateRandomGraph(nodeCount);
    setRandomGraph(newGraph);
    setSourceNodeId(newGraph.nodes[0]?.id || 'A');
    setDestinationNodeId(null);
  };
  
  // Update visualization when inputs change
  useEffect(() => {
    // Calculate shortest paths and distances
    const { distances, paths } = dijkstra(randomGraph, sourceNodeId, trafficLevel);
    
    // Apply time of day factor to adjust weights (e.g., rush hour multiplier)
    const timeAdjustedDistances = { ...distances };
    if ((timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 16 && timeOfDay <= 18)) {
      // Rush hour: increase all distances by additional 20%
      Object.keys(timeAdjustedDistances).forEach(key => {
        if (typeof timeAdjustedDistances[key] === 'number' && timeAdjustedDistances[key] !== Infinity) {
          timeAdjustedDistances[key] *= 1.2;
        }
      });
    }
    
    // Get colored edges based on travel times
    const edges = getColoredEdges(
      randomGraph, 
      sourceNodeId, 
      trafficLevel, 
      getColorForTime,
      destinationNodeId
    );
    
    // Update state
    setColoredEdges(edges);
    setDistances(timeAdjustedDistances);
    setPaths(paths);
  }, [randomGraph, sourceNodeId, destinationNodeId, trafficLevel, timeOfDay]);
  
  // Handle node click
  const handleNodeClick = (nodeId: string) => {
    if (nodeId === sourceNodeId) {
      // Clicking on the source node again does nothing
      return;
    }
    
    if (destinationNodeId === nodeId) {
      // Clicking on the current destination clears it
      setDestinationNodeId(null);
    } else {
      // Set as destination
      setDestinationNodeId(nodeId);
    }
  };
  
  // Handle destination selection from results panel
  const handleDestinationSelect = (nodeId: string) => {
    if (destinationNodeId === nodeId) {
      setDestinationNodeId(null);
    } else {
      setDestinationNodeId(nodeId);
    }
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    // Apply dark mode to document
    document.documentElement.classList.toggle('dark');
  };
  
  return (
    <div className={`min-h-screen p-4 md:p-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      <header className="mb-6 flex flex-col md:flex-row justify-between items-center">
        <div className="text-center md:text-left">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Route Rainbow Mapper</h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Visualize travel times with color-coded routes
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="flex items-center space-x-2">
            <label className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Nodes:
            </label>
            <input 
              type="number" 
              min="3" 
              max="20" 
              value={nodeCount} 
              onChange={(e) => setNodeCount(Math.min(20, Math.max(3, parseInt(e.target.value) || 3)))}
              className={`w-16 px-2 py-1 rounded border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
            />
            <button
              onClick={handleGenerateGraph}
              className={`px-3 py-1 rounded ${
                isDarkMode 
                  ? 'bg-primary hover:bg-primary/90 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Generate
            </button>
          </div>
          
          <button
            onClick={toggleDarkMode}
            className={`px-4 py-2 rounded-full transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar with controls */}
        <div className="lg:col-span-1 space-y-6">
          <ControlPanel 
            nodes={randomGraph.nodes}
            sourceNodeId={sourceNodeId}
            trafficLevel={trafficLevel}
            timeOfDay={timeOfDay}
            onSourceNodeChange={setSourceNodeId}
            onTrafficLevelChange={setTrafficLevel}
            onTimeOfDayChange={setTimeOfDay}
            isDarkMode={isDarkMode}
          />
          
          <Legend isDarkMode={isDarkMode} />
          
          <ResultsPanel 
            sourceNodeId={sourceNodeId}
            destinationNodeId={destinationNodeId}
            nodes={randomGraph.nodes}
            distances={distances}
            paths={paths}
            trafficLevel={trafficLevel}
            timeOfDay={timeOfDay}
            onDestinationSelect={handleDestinationSelect}
            isDarkMode={isDarkMode}
          />
        </div>
        
        {/* Main graph visualization area */}
        <div className={`lg:col-span-2 rounded-lg shadow-md overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <GraphVisualization 
            graph={randomGraph}
            coloredEdges={coloredEdges}
            sourceNodeId={sourceNodeId}
            destinationNodeId={destinationNodeId}
            onNodeClick={handleNodeClick}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
      
      <footer className={`mt-8 text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>Route Rainbow Mapper - Based on Dijkstra's Algorithm</p>
      </footer>
    </div>
  );
};

export default Index;
