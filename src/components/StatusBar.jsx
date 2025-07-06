import React from 'react';
import PropTypes from 'prop-types';

const StatusBar = ({ message = "Status: Ready.", graph = null }) => {
  const isReady = message.toLowerCase().includes('ready');
  const isSuccess = message.toLowerCase().includes('added') || message.toLowerCase().includes('colored');
  const isAction = message.toLowerCase().includes('graph') || message.toLowerCase().includes('toggle');
  
  const getStatusColor = () => {
    if (isReady) return 'bg-emerald-400';
    if (isSuccess) return 'bg-blue-400';
    if (isAction) return 'bg-indigo-400';
    return 'bg-slate-400';
  };

  const getGraphInfo = () => {
    if (!graph) return 'No graph';
    return `Vertices: ${graph.vertices.length} | Edges: ${graph.edges.length} | Periphery: ${graph.periphery?.length || 0}`;
  };

  return (
    <div className="h-12 bg-white/80 backdrop-blur-sm border-t border-slate-200/60 px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
          <span className="text-sm font-medium text-slate-600">
            {message}
          </span>
        </div>
        
        {/* Graph Info */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-mono">|</span>
          <span>{getGraphInfo()}</span>
        </div>
      </div>

      {/* Version Info */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-400">
          Graph Editor v1.0
        </span>
        <span className="text-xs text-slate-300">|</span>
        <span className="text-xs font-medium text-slate-400">
          Press ? for help
        </span>
      </div>
    </div>
  );
};

StatusBar.propTypes = {
  message: PropTypes.string,
  graph: PropTypes.shape({
    vertices: PropTypes.array,
    edges: PropTypes.array,
    periphery: PropTypes.array
  })
};

export default StatusBar; 