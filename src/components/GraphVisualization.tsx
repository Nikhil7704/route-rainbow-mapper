
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Graph, Node as GraphNode, ColoredEdge, TrafficLevel } from '../utils/sampleData';

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
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });
  const [isAnimating, setIsAnimating] = useState(false);

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const parentWidth = svgRef.current.parentElement?.clientWidth || 1000;
        setDimensions({
          width: parentWidth,
          height: Math.min(600, parentWidth * 0.7)
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Render graph visualization
  useEffect(() => {
    if (!svgRef.current || !graph.nodes.length) return;

    // Set animation state
    setIsAnimating(true);

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current);
    
    // Create a group for the graph
    const g = svg.append('g');

    // Add zoom functionality
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create a gradient for selected path animation
    const defs = svg.append('defs');
    
    // Animated gradient for selected path
    const gradient = defs.append('linearGradient')
      .attr('id', 'path-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
      
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', isDarkMode ? '#1e293b' : '#f1f5f9');
      
    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#9b87f5')
      .attr('stop-opacity', 0.8);
      
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', isDarkMode ? '#1e293b' : '#f1f5f9');
    
    // Animate the gradient
    gradient.append('animateTransform')
      .attr('attributeName', 'gradientTransform')
      .attr('type', 'translate')
      .attr('from', '-1')
      .attr('to', '1')
      .attr('dur', '3s')
      .attr('repeatCount', 'indefinite');

    // Draw links (edges)
    coloredEdges.forEach(edge => {
      const sourceNode = graph.nodes.find(n => n.id === edge.source);
      const targetNode = graph.nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        // Check if this edge is part of the selected path
        const isOnSelectedPath = destinationNodeId !== null && edge.arrivalTime !== -1;
        
        // Draw edge line
        const line = g.append('line')
          .attr('class', 'link')
          .attr('x1', sourceNode.x)
          .attr('y1', sourceNode.y)
          .attr('x2', targetNode.x)
          .attr('y2', targetNode.y)
          .attr('stroke', isOnSelectedPath ? edge.color : isDarkMode ? '#4b5563' : '#d1d5db')
          .attr('stroke-width', isOnSelectedPath ? 4 : 2)
          .style('stroke-dasharray', isOnSelectedPath ? '0' : '0')
          .style('opacity', isOnSelectedPath ? 1 : 0.6);
          
        // Add glow effect for selected path
        if (isOnSelectedPath) {
          line.attr('filter', 'url(#glow)')
            .attr('stroke-linecap', 'round');
            
          // Animate the selected path
          line.style('stroke-dasharray', '0')
            .style('stroke-dashoffset', '0')
            .transition()
            .duration(500)
            .ease(d3.easeLinear)
            .style('opacity', 1);
        }
        
        // Add title for tooltip
        line.append('title')
          .text(() => {
            // Fix toFixed error by checking if arrivalTime is valid number
            if (edge.arrivalTime === undefined || edge.arrivalTime === -1) {
              return `Not on shortest path`;
            }
            
            // Make sure edge.weight exists and is a number before using toFixed
            const travelTime = typeof edge.weight === 'number' 
              ? edge.weight.toFixed(1) 
              : 'Unknown';
              
            // Make sure edge.arrivalTime exists and is a number before using toFixed
            const arrivalTime = typeof edge.arrivalTime === 'number' 
              ? edge.arrivalTime.toFixed(1) 
              : 'Unknown';
              
            return `Travel time: ${travelTime} min
Arrival at ${targetNode.name}: ${arrivalTime} min`;
          });
      }
    });

    // Filter for glow effect
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
      
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '2')
      .attr('result', 'coloredBlur');
      
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Draw nodes
    graph.nodes.forEach(node => {
      // Determine node status
      const isSource = node.id === sourceNodeId;
      const isDestination = node.id === destinationNodeId;
      
      // Create node group
      const nodeGroup = g.append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .attr('cursor', 'pointer')
        .on('click', () => onNodeClick(node.id));

      // Draw outer ring for source/destination
      if (isSource || isDestination) {
        nodeGroup.append('circle')
          .attr('r', 24)
          .attr('fill', 'none')
          .attr('stroke', isSource ? '#9b87f5' : '#ef4444')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', isDestination ? '3,2' : '0')
          .attr('opacity', 0)
          .transition()
          .duration(500)
          .attr('opacity', 1);
      }

      // Fix the chaining issue by separating the append and transition operations
      const nodeCircle = nodeGroup.append('circle')
        .attr('class', `node ${node.id === sourceNodeId ? 'selected' : ''}`)
        .attr('r', 20)
        .attr('fill', isSource ? '#9b87f5' : isDestination ? '#ef4444' : isDarkMode ? '#64748b' : '#64748b')
        .attr('opacity', 0);
        
      // Add transition after creating the circle
      nodeCircle.transition()
        .duration(500)
        .attr('opacity', 1)
        .on('end', () => setIsAnimating(false));
        
      // Add title separately
      nodeCircle.append('title')
        .text(`${node.name} (${node.id})`);

      // Draw node label
      nodeGroup.append('text')
        .attr('class', 'node-label')
        .attr('dy', 4)
        .text(node.id)
        .style('fill', isSource || isDestination ? 'white' : isDarkMode ? 'white' : 'white')
        .style('font-weight', isSource || isDestination ? 'bold' : 'normal');
    });

    // Center the graph initially
    const minX = Math.min(...graph.nodes.map(n => n.x));
    const maxX = Math.max(...graph.nodes.map(n => n.x));
    const minY = Math.min(...graph.nodes.map(n => n.y));
    const maxY = Math.max(...graph.nodes.map(n => n.y));
    
    const graphWidth = maxX - minX + 100;
    const graphHeight = maxY - minY + 100;
    
    const scale = Math.min(
      dimensions.width / graphWidth,
      dimensions.height / graphHeight
    );
    
    const translateX = dimensions.width / 2 - (minX + maxX) / 2 * scale;
    const translateY = dimensions.height / 2 - (minY + maxY) / 2 * scale;
    
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(translateX, translateY)
      .scale(scale * 0.9));

  }, [graph, coloredEdges, sourceNodeId, destinationNodeId, dimensions, onNodeClick, isDarkMode]);

  return (
    <div className={`w-full h-full overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {isAnimating && (
        <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded text-xs">
          Calculating routes...
        </div>
      )}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        style={{ background: isDarkMode ? '#1f2937' : 'white' }}
      />
    </div>
  );
};

export default GraphVisualization;
