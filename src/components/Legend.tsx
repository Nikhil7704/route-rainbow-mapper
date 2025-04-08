
import React from 'react';
import { timeBuckets } from '../utils/sampleData';

const Legend: React.FC = () => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md">
      <h3 className="font-semibold text-lg mb-3">Travel Time Legend</h3>
      
      <div className="space-y-2">
        {timeBuckets.map((bucket, index) => {
          const isLast = index === timeBuckets.length - 1;
          const minTime = index === 0 ? 0 : timeBuckets[index - 1].max;
          const maxTime = isLast ? '15+' : bucket.max;
          const timeLabel = isLast ? `${minTime}+ minutes` : `${minTime}-${maxTime} minutes`;
          
          return (
            <div key={index} className="flex items-center">
              <div 
                className="w-6 h-6 rounded mr-2" 
                style={{ backgroundColor: bucket.color }}
              />
              <span>{timeLabel}</span>
            </div>
          );
        })}
        
        <div className="flex items-center mt-1">
          <div 
            className="w-6 h-6 rounded mr-2" 
            style={{ backgroundColor: '#d1d5db' }}
          />
          <span>Not on shortest path</span>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Colors represent total travel time from the starting location to each destination.</p>
      </div>
    </div>
  );
};

export default Legend;
