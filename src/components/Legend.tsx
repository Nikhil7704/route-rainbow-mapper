
import React from 'react';
import { timeBuckets } from '../utils/sampleData';

interface LegendProps {
  isDarkMode?: boolean;
}

const Legend: React.FC<LegendProps> = ({ isDarkMode = false }) => {
  return (
    <div className={`p-5 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
      <h3 className={`font-semibold text-lg mb-3 ${isDarkMode ? 'text-white' : ''}`}>Travel Time Legend</h3>
      
      <div className="space-y-3">
        {timeBuckets.map((bucket, index) => {
          const isLast = index === timeBuckets.length - 1;
          const minTime = index === 0 ? 0 : timeBuckets[index - 1].max;
          const maxTime = isLast ? '15+' : bucket.max;
          const timeLabel = isLast ? `${minTime}+ minutes` : `${minTime}-${maxTime} minutes`;
          
          return (
            <div key={index} className="flex items-center">
              <div 
                className="w-8 h-4 rounded mr-2 shadow-sm border" 
                style={{ 
                  backgroundColor: bucket.color,
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                }}
              />
              <span className={isDarkMode ? 'text-white' : ''}>
                {timeLabel}
                <span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {index === 0 ? '(Fast)' : isLast ? '(Slow)' : ''}
                </span>
              </span>
            </div>
          );
        })}
        
        <div className="flex items-center mt-1">
          <div 
            className="w-8 h-4 rounded mr-2 shadow-sm border" 
            style={{ 
              backgroundColor: isDarkMode ? '#64748b' : '#d1d5db',
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
            }}
          />
          <span className={isDarkMode ? 'text-white' : ''}>Not on shortest path</span>
        </div>
      </div>
      
      <div className={`mt-4 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>Colors represent total travel time from the starting location to each destination.</p>
        <p className="mt-1">Rush hour (7-9 AM, 4-6 PM) adds 20% to travel times.</p>
        <p className="mt-1">Selected routes are shown with thicker, animated edges.</p>
      </div>
    </div>
  );
};

export default Legend;
