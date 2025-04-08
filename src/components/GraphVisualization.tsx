
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Graph, Node as GraphNode, ColoredEdge, TrafficLevel } from '../utils/sampleData';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [hoveredEdge, setHoveredEdge] = useState<ColoredEdge | null>(null);

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
      
    // Create marker for directional arrows
    defs.append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", isDarkMode ? "#9b87f5" : "#9b87f5");

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

    // Draw links (edges)
    coloredEdges.forEach(edge => {
      const sourceNode = graph.nodes.find(n => n.id === edge.source);
      const targetNode = graph.nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        // Check if this edge is part of the selected path
        const isOnSelectedPath = destinationNodeId !== null && edge.isOnPath === true;
        
        // Calculate path for curved line if it's part of the selected path
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dr = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate midpoint for potential arrow
        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        
        // Draw edge line
        let line;
        
        if (isOnSelectedPath) {
          // Use curved lines for selected path to make it distinct
          line = g.append('path')
            .attr('class', 'link selected-path')
            .attr('d', `M${sourceNode.x},${sourceNode.y} L${targetNode.x},${targetNode.y}`)
            .attr('stroke', edge.color)
            .attr('stroke-width', 4)
            .attr('fill', 'none')
            .attr('marker-mid', "url(#arrowhead)")
            .style('opacity', 0)
            .attr('filter', 'url(#glow)');
            
          // Animate the selected path with dash array
          const pathLength = line.node()?.getTotalLength() || 0;
          line.attr('stroke-dasharray', pathLength)
            .attr('stroke-dashoffset', pathLength)
            .transition()
            .duration(1000)
            .attr('stroke-dashoffset', 0)
            .style('opacity', 1);
            
          // Add arrow in the middle of the path
          g.append('circle')
            .attr('cx', midX)
            .attr('cy', midY)
            .attr('r', 3)
            .attr('fill', edge.color)
            .attr('opacity', 0)
            .transition()
            .duration(1200)
            .attr('opacity', 1);
        } else {
          // Use straight lines for non-selected paths
          line = g.append('line')
            .attr('class', 'link')
            .attr('x1', sourceNode.x)
            .attr('y1', sourceNode.y)
            .attr('x2', targetNode.x)
            .attr('y2', targetNode.y)
            .attr('stroke', isDarkMode ? '#4b5563' : '#d1d5db')
            .attr('stroke-width', 2)
            .style('opacity', 0.4);
        }
        
        // Add interactivity to the line
        line.on('mouseover', function(event) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('stroke-width', isOnSelectedPath ? 6 : 3)
            .style('opacity', 1);
            
          // Create tooltip with edge information
          const tooltip = d3.select('#edge-tooltip');
          tooltip.style('display', 'block')
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 20) + 'px');
            
          const travelTime = typeof edge.weight === 'number' 
            ? edge.weight.toFixed(1) 
            : 'Unknown';
              
          const arrivalTime = typeof edge.arrivalTime === 'number' && edge.arrivalTime !== -1
            ? edge.arrivalTime.toFixed(1) 
            : 'N/A';
            
          tooltip.html(`
            <div class="p-2">
              <div>From: ${sourceNode.name} (${edge.source})</div>
              <div>To: ${targetNode.name} (${edge.target})</div>
              <div>Travel time: ${travelTime} min</div>
              <div>Total time: ${arrivalTime} min</div>
            </div>
          `);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('stroke-width', isOnSelectedPath ? 4 : 2)
            .style('opacity', isOnSelectedPath ? 1 : 0.4);
            
          d3.select('#edge-tooltip').style('display', 'none');
        });
      }
    });

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
    <div className={`w-full h-full overflow-hidden relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
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
      
      {/* Tooltip for edge hover */}
      <div 
        id="edge-tooltip" 
        className={`absolute hidden p-2 rounded shadow-lg text-xs z-10 ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        }`} 
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
};

export default GraphVisualization;
