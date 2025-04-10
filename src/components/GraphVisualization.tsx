
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  Node as FlowNode,
  Edge as FlowEdge,
  ConnectionLineType,
  Position,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Graph, ColoredEdge, Node as GraphNode } from '../utils/sampleData';

interface GraphVisualizationProps {
  graph: Graph;
  coloredEdges: ColoredEdge[];
  sourceNodeId: string;
  destinationNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
  isDarkMode?: boolean;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  graph,
  coloredEdges,
  sourceNodeId,
  destinationNodeId,
  onNodeClick,
  isDarkMode = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<ColoredEdge | null>(null);

  // Transform graph nodes to react-flow nodes
  const flowNodes = useMemo<FlowNode[]>(() => {
    if (!graph.nodes) return [];
    
    return graph.nodes.map((node) => {
      const isSource = node.id === sourceNodeId;
      const isDestination = node.id === destinationNodeId;
      
      return {
        id: node.id,
        position: { x: node.x, y: node.y },
        data: { 
          label: `${node.name} (${node.id})`,
          isSource,
          isDestination
        },
        style: {
          background: isSource ? '#9b87f5' : isDestination ? '#ef4444' : isDarkMode ? '#475569' : '#64748b',
          color: 'white',
          border: '3px solid',
          borderColor: isSource ? '#9b87f5' : isDestination ? '#ef4444' : 'transparent',
          width: 120,
          height: 60,
          borderRadius: 8,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: isSource || isDestination ? 'bold' : 'normal',
          boxShadow: isDarkMode ? '0 4px 8px rgba(0, 0, 0, 0.5)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
        },
        className: `node ${isSource ? 'source' : ''} ${isDestination ? 'destination' : ''}`
      };
    });
  }, [graph.nodes, sourceNodeId, destinationNodeId, isDarkMode]);

  // Transform graph edges to react-flow edges
  const flowEdges = useMemo<FlowEdge[]>(() => {
    if (!coloredEdges) return [];
    
    return coloredEdges.map((edge, index) => {
      const isOnPath = edge.isOnPath || false;
      const edgeColor = isOnPath ? edge.color : isDarkMode ? '#64748b' : '#cbd5e1';
      const edgeWidth = isOnPath ? 4 : 2; // Make the edges thicker as requested
      const edgeOpacity = isOnPath ? 1 : isDarkMode ? 0.6 : 0.5;
      
      return {
        id: `e-${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        animated: isOnPath,
        style: { 
          stroke: edgeColor,
          strokeWidth: edgeWidth,
          opacity: edgeOpacity
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 20,
          height: 20
        },
        type: 'smoothstep',
        data: {
          weight: edge.weight,
          arrivalTime: edge.arrivalTime,
          isOnPath: edge.isOnPath
        },
        className: isOnPath ? 'edge-on-path' : 'edge'
      };
    });
  }, [coloredEdges, isDarkMode]);

  // Handle node click for setting source/destination
  const onNodeClicked = useCallback((_, node) => {
    onNodeClick(node.id);
  }, [onNodeClick]);

  // Handle edge mouse events
  const onEdgeMouseEnter = useCallback((_, edge) => {
    const originalEdge = coloredEdges.find(e => 
      (e.source === edge.source && e.target === edge.target) || 
      (e.source === edge.target && e.target === edge.source)
    );
    if (originalEdge) {
      setHoveredEdge(originalEdge);
    }
  }, [coloredEdges]);

  const onEdgeMouseLeave = useCallback(() => {
    setHoveredEdge(null);
  }, []);

  // Custom edge tooltip
  const EdgeTooltip = () => {
    if (!hoveredEdge) return null;
    
    const sourceNode = graph.nodes.find(n => n.id === hoveredEdge.source);
    const targetNode = graph.nodes.find(n => n.id === hoveredEdge.target);
    
    if (!sourceNode || !targetNode) return null;
    
    // Format time values
    const travelTime = typeof hoveredEdge.weight === 'number' 
      ? hoveredEdge.weight.toFixed(1) 
      : 'Unknown';
        
    const arrivalTime = typeof hoveredEdge.arrivalTime === 'number' && hoveredEdge.arrivalTime !== -1
      ? hoveredEdge.arrivalTime.toFixed(1) 
      : 'N/A';
    
    return (
      <div 
        className={`absolute p-3 rounded-lg shadow-lg text-sm z-10 ${
          isDarkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-800 border border-gray-200'
        }`}
        style={{ 
          left: '50%', 
          top: '10%', 
          transform: 'translateX(-50%)',
          pointerEvents: 'none'
        }}
      >
        <div className="font-medium">Edge Information</div>
        <div className="mt-1">From: {sourceNode.name} ({sourceNode.id})</div>
        <div>To: {targetNode.name} ({targetNode.id})</div>
        <div>Travel time: {travelTime} min</div>
        <div>Total time: {arrivalTime} min</div>
        {hoveredEdge.isOnPath && <div className="font-bold text-purple-500 mt-1">★ On selected path</div>}
      </div>
    );
  };

  // Set up animation when props change
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [graph, coloredEdges, sourceNodeId, destinationNodeId]);

  return (
    <div 
      className={`w-full h-full overflow-hidden relative rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} 
      style={{ height: '600px' }}
    >
      {isAnimating && (
        <div className="absolute top-2 right-2 bg-primary text-white px-3 py-1.5 rounded-full text-xs z-10 font-medium animate-pulse">
          Calculating routes...
        </div>
      )}
      
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodeClick={onNodeClicked}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
        fitView
        minZoom={0.5}
        maxZoom={2}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        <Controls 
          className={isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : ''}
          position="bottom-right"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={node => {
            const n = node as FlowNode;
            if (n.data.isSource) return '#9b87f5';
            if (n.data.isDestination) return '#ef4444';
            return isDarkMode ? '#475569' : '#64748b';
          }}
          maskColor={isDarkMode ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)'}
          style={{
            backgroundColor: isDarkMode ? '#1e293b' : 'white',
            border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb'
          }}
        />
        <Background 
          color={isDarkMode ? '#334155' : '#f3f4f6'} 
          gap={16} 
          size={1}
        />
        
        {/* Edge Tooltip */}
        {hoveredEdge && <EdgeTooltip />}
      </ReactFlow>
    </div>
  );
};

export default GraphVisualization;
