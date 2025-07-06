import React from 'react';
import PropTypes from 'prop-types';

const ShortcutBadge = ({ shortcut, label, description }) => (
  <div className="flex flex-col gap-1 py-2.5 px-4 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 hover:border-blue-200/60 transition-all duration-200">
    <div className="flex items-center justify-between">
      <span className="text-slate-600 text-sm">{label}</span>
      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-mono font-medium">{shortcut}</span>
    </div>
    {description && (
      <span className="text-xs text-slate-500">{description}</span>
    )}
  </div>
);

const ActionButton = ({ onClick, primary, icon, children }) => (
  <button
    onClick={onClick}
    className={`w-full px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${primary
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-200/50 active:opacity-90'
        : 'bg-white/80 backdrop-blur-sm text-slate-700 border border-slate-200/60 hover:border-blue-200/60 hover:bg-blue-50/50'
      }`}
  >
    {icon && (
      <span className="text-lg">{icon}</span>
    )}
    {children}
  </button>
);

const ControlPanel = ({
  onStart,
  onAddVertexManual,
  onAddVertexRandom,
  onColorLastVertex,
  onToggleDisplayMode,
  onJumpToState,
  graph
}) => (
  <div className="w-[20%] bg-white/50 backdrop-blur-sm border-r border-slate-200/60 h-full overflow-y-auto">
    <div className="p-6 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Controls</h3>
        <p className="text-sm text-slate-500">Manage your graph visualization</p>
      </div>

      {/* Shortcuts Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-600 mb-3">Keyboard Shortcuts</h4>
        <div className="grid gap-2">
          <ShortcutBadge
            shortcut="S"
            label="Start New Graph"
            description="Initialize with triangle (V1, V2, V3)"
          />
          <ShortcutBadge
            shortcut="A,1-3"
            label="Add Vertex"
            description="Connect to specified periphery vertices"
          />
          <ShortcutBadge
            shortcut="R"
            label="Random Vertex"
            description="Add vertex with random connections"
          />
          <ShortcutBadge
            shortcut="C"
            label="Color Vertex"
            description="Color the latest vertex (4-color palette)"
          />
          <ShortcutBadge
            shortcut="T"
            label="Toggle Labels"
            description="Switch between vertex order/color number"
          />
          <ShortcutBadge
            shortcut="G34"
            label="Jump to State"
            description="Display graph up to specified vertex"
          />
        </div>
      </div>

      {/* Actions Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-600 mb-3">Actions</h4>
        <ActionButton onClick={onStart} primary icon="▶">
          Start New Graph
        </ActionButton>
        <ActionButton onClick={onAddVertexManual} icon="✚">
          Add Vertex (Manual)
        </ActionButton>
        <ActionButton onClick={onAddVertexRandom} icon="🎲">
          Add Vertex (Random)
        </ActionButton>
        <ActionButton onClick={onColorLastVertex} icon="🎨">
          Color Last Vertex
        </ActionButton>
        <ActionButton onClick={onToggleDisplayMode} icon="🔄">
          Toggle Labels
        </ActionButton>

        {/* Jump to State Input */}
        {graph && (
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max={graph.vertices.length}
              placeholder="Vertex #"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 text-sm focus:outline-none focus:border-blue-300"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = parseInt(e.target.value, 10);
                  if (value && value > 0) {
                    onJumpToState(value);
                    e.target.value = '';
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.querySelector('input[type="number"]');
                const value = parseInt(input.value, 10);
                if (value && value > 0) {
                  onJumpToState(value);
                  input.value = '';
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200/60 text-sm hover:border-blue-200/60 hover:bg-blue-50/50"
            >
              Jump
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-auto pt-4 border-t border-slate-200/60">
        <p className="text-xs text-slate-500 text-center">
          Press ? for keyboard shortcuts
        </p>
      </div>
    </div>
  </div>
);

ControlPanel.propTypes = {
  onStart: PropTypes.func.isRequired,
  onAddVertexManual: PropTypes.func.isRequired,
  onAddVertexRandom: PropTypes.func.isRequired,
  onColorLastVertex: PropTypes.func.isRequired,
  onToggleDisplayMode: PropTypes.func.isRequired,
  onJumpToState: PropTypes.func.isRequired,
  graph: PropTypes.object
};

ShortcutBadge.propTypes = {
  shortcut: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string
};

ActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  primary: PropTypes.bool,
  icon: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default ControlPanel; 