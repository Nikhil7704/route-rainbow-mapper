
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Graph, Node as GraphNode, ColoredEdge, TrafficLevel } from '../utils/sampleData';

interface GraphVisualizationProps {
  graph: Graph;
  coloredEdges: ColoredEdge[];
  sourceNodeId: string;
  onNodeClick: (nodeId: string) => void;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  graph,
  coloredEdges,
  sourceNodeId,
  onNodeClick
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 600 });

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

    // Draw links (edges)
    coloredEdges.forEach(edge => {
      const sourceNode = graph.nodes.find(n => n.id === edge.source);
      const targetNode = graph.nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        // Draw edge line
        g.append('line')
          .attr('class', 'link')
          .attr('x1', sourceNode.x)
          .attr('y1', sourceNode.y)
          .attr('x2', targetNode.x)
          .attr('y2', targetNode.y)
          .attr('stroke', edge.color)
          .attr('stroke-width', 3)
          .append('title')
          .text(() => {
            if (edge.arrivalTime === -1) {
              return `Not on shortest path`;
            }
            return `Travel time: ${edge.weight.toFixed(1)} min
Arrival at ${targetNode.name}: ${edge.arrivalTime.toFixed(1)} min`;
          });
      }
    });

    // Draw nodes
    graph.nodes.forEach(node => {
      // Create node group
      const nodeGroup = g.append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .attr('cursor', 'pointer')
        .on('click', () => onNodeClick(node.id));

      // Draw node circle
      nodeGroup.append('circle')
        .attr('class', `node ${node.id === sourceNodeId ? 'selected' : ''}`)
        .attr('r', 20)
        .attr('fill', node.id === sourceNodeId ? '#9b87f5' : '#64748b')
        .append('title')
        .text(`${node.name} (${node.id})`);

      // Draw node label
      nodeGroup.append('text')
        .attr('class', 'node-label')
        .attr('dy', 4)
        .text(node.id)
        .style('fill', node.id === sourceNodeId ? 'white' : 'white');
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

  }, [graph, coloredEdges, sourceNodeId, dimensions, onNodeClick]);

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-md overflow-hidden">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
    </div>
  );
};

export default GraphVisualization;
