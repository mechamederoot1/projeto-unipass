import React from 'react';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  showValues?: boolean;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  height = 200, 
  showValues = true,
  className = ''
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-end space-x-2" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 40) : 0;
          const color = item.color || '#0ea5e9';
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full rounded-t-lg transition-all duration-500 ease-out relative group cursor-pointer"
                style={{ 
                  height: `${barHeight}px`,
                  backgroundColor: color,
                  minHeight: item.value > 0 ? '4px' : '0px'
                }}
              >
                {showValues && item.value > 0 && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.value}
                  </div>
                )}
              </div>
              <div className="mt-2 text-xs text-gray-600 text-center w-full">
                <div className="truncate">{item.label}</div>
                {showValues && (
                  <div className="font-medium text-gray-900">{item.value}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface PieChartProps {
  data: ChartDataPoint[];
  size?: number;
  showLegend?: boolean;
  className?: string;
}

export const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  size = 200, 
  showLegend = true,
  className = ''
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height: size }}>
        <div className="text-gray-500 text-sm">Sem dados disponíveis</div>
      </div>
    );
  }
  
  let currentAngle = 0;
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;
  
  const colors = [
    '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
  ];
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={size} height={size} className="mb-4">
        {data.map((item, index) => {
          const angle = (item.value / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          
          // Calculate path
          const startAngleRad = (startAngle * Math.PI) / 180;
          const endAngleRad = (endAngle * Math.PI) / 180;
          
          const x1 = centerX + radius * Math.cos(startAngleRad);
          const y1 = centerY + radius * Math.sin(startAngleRad);
          const x2 = centerX + radius * Math.cos(endAngleRad);
          const y2 = centerY + radius * Math.sin(endAngleRad);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          currentAngle += angle;
          
          const color = item.color || colors[index % colors.length];
          
          return (
            <g key={index}>
              <path
                d={pathData}
                fill={color}
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              {/* Label */}
              {angle > 15 && (
                <text
                  x={centerX + (radius * 0.7) * Math.cos((startAngleRad + endAngleRad) / 2)}
                  y={centerY + (radius * 0.7) * Math.sin((startAngleRad + endAngleRad) / 2)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-white font-medium"
                >
                  {Math.round((item.value / total) * 100)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
      
      {showLegend && (
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
          {data.map((item, index) => {
            const color = item.color || colors[index % colors.length];
            const percentage = Math.round((item.value / total) * 100);
            
            return (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-600 truncate">{item.label}</div>
                  <div className="text-xs font-medium">{item.value} ({percentage}%)</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface LineChartProps {
  data: { x: string; y: number }[];
  height?: number;
  color?: string;
  showDots?: boolean;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  color = '#0ea5e9',
  showDots = true,
  className = ''
}) => {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-gray-500 text-sm">Sem dados disponíveis</div>
      </div>
    );
  }
  
  const maxValue = Math.max(...data.map(d => d.y));
  const minValue = Math.min(...data.map(d => d.y));
  const range = maxValue - minValue || 1;
  
  const width = 300;
  const padding = 20;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + ((maxValue - point.y) / range) * chartHeight;
    return { x, y, value: point.y, label: point.x };
  });
  
  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');
  
  return (
    <div className={className}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Area under curve */}
        <path
          d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`}
          fill={color}
          fillOpacity="0.1"
        />
        
        {/* Dots */}
        {showDots && points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="white"
            stroke={color}
            strokeWidth="3"
            className="cursor-pointer hover:r-6 transition-all"
          >
            <title>{`${point.label}: ${point.value}`}</title>
          </circle>
        ))}
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2 px-5">
        {data.map((item, index) => (
          <div key={index} className="text-xs text-gray-600 text-center">
            {item.x}
          </div>
        ))}
      </div>
    </div>
  );
};
