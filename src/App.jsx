import { useState, useEffect } from 'react'
import MenuBar from './components/MenuBar'
import ControlPanel from './components/ControlPanel'
import GraphCanvas from './components/GraphCanvas'
import StatusBar from './components/StatusBar'

function App() {
  const [status, setStatus] = useState('Status: Ready.')
  const [graph, setGraph] = useState(null)
  const [displayMode, setDisplayMode] = useState('order')
  const [isHelpVisible, setIsHelpVisible] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Keyboard shortcuts and manual input handling
  useEffect(() => {
    let buffer = '';
    let bufferTimeout;

    const clearBuffer = () => {
      buffer = '';
      if (bufferTimeout) clearTimeout(bufferTimeout);
    };

    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();

      // Help overlay
      if (key === '?' || key === '/') {
        e.preventDefault();
        setIsHelpVisible(!isHelpVisible);
        return;
      }

      // Basic shortcuts
      if (key === 'r' && graph) handleAddVertexRandom(dimensions);
      if (key === 'c' && graph) handleColorLastVertex();
      if (key === 't' && graph) handleToggleDisplayMode();

      // Buffer-based commands
      if (key.match(/[a-z0-9,\-]/i)) {
        buffer += key;
        if (bufferTimeout) clearTimeout(bufferTimeout);
        bufferTimeout = setTimeout(clearBuffer, 1500);

        // Manual vertex addition (A,1-3)
        if (/^a,?([0-9,-]*)$/i.test(buffer)) {
          const match = buffer.match(/^a,?([0-9,-]*)$/i);
          if (match && match[1] && graph) {
            let ids = [];
            if (match[1].includes('-')) {
              const [start, end] = match[1].split('-').map(Number);
              if (Number.isFinite(start) && Number.isFinite(end)) {
                ids = Array.from({ length: end - start + 1 }, (_, i) => start + i);
              }
            } else {
              ids = match[1].split(',').map(s => parseInt(s, 10)).filter(Number.isFinite);
            }

            if (ids.length && ids.every(id => graph.periphery.includes(id))) {
              const newGraph = addVertexManual(graph, ids);
              setGraph(newGraph);
              setStatus(`Added V${newGraph.vertices.length} to periphery (connected to ${ids.join(', ')}).`);
            } else if (ids.length) {
              setStatus('Invalid periphery vertex id(s).');
            }
            clearBuffer();
          }
        }

        // Jump to state (G34)
        else if (/^g([0-9]+)$/i.test(buffer)) {
          const match = buffer.match(/^g([0-9]+)$/i);
          if (match && graph) {
            const n = parseInt(match[1], 10);
            handleJumpToState(n);
            clearBuffer();
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (bufferTimeout) clearTimeout(bufferTimeout);
    };
  }, [graph, isHelpVisible]);

  // Handle Add Vertex (Random)
  const handleAddVertexRandom = (dimensions) => {
    if (!graph) return;
    console.log(dimensions)
    const newGraph = addVertexRandom(graph, dimensions);
    if (newGraph === graph) {
      setStatus('Cannot add vertex: not enough periphery vertices or invalid state.');
      return;
    }
    const last = newGraph.vertices[newGraph.vertices.length - 1];
    const connected = newGraph.edges
      .filter(e => e[0] === last.id || e[1] === last.id)
      .map(e => e[0] === last.id ? e[1] : e[0]);
    setGraph(newGraph);
    setStatus(`Added V${last.id} connected to periphery vertices: ${connected.join(', ')}`);
  }

  // Add Vertex (Manual)
  const handleAddVertexManual = () => {
    setStatus('Type A,1-3 to add vertex connected to specific periphery vertices.');
  };

  // Color Last Vertex
  const handleColorLastVertex = () => {
    if (!graph) return;
    const newGraph = colorLastVertex(graph);
    const lastId = newGraph.order[newGraph.order.length - 1];
    const color = newGraph.colors[lastId];
    setGraph(newGraph);
    setStatus(`Colored V${lastId} as ${color} (${(COLORS.indexOf(color) + 1) || 1})`);
  };

  // Toggle Display Mode
  const handleToggleDisplayMode = () => {
    if (!graph) return;
    setDisplayMode(prev => prev === 'order' ? 'color' : 'order');
    setStatus(`Display mode: ${displayMode === 'order' ? 'Color Numbers' : 'Vertex Order'}`);
  };

  // Jump to State
  const handleJumpToState = (n) => {
    if (!graph) return;
    const newGraph = jumpToVertex(graph, n);
    setGraph(newGraph);
    setStatus(`Displaying graph up to Vertex ${Math.min(n, graph.vertices.length)}`);
  };

  // Save graph to file
  const handleSave = () => {
    if (!graph) return;
    const data = exportGraph(graph);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Graph saved to graph.json');
  };

  // Load graph from file
  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const loaded = importGraph(evt.target.result);
        if (loaded) {
          setGraph(loaded);
          setStatus('Graph loaded from file.');
        } else {
          setStatus('Failed to load graph.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/10 to-indigo-50/10">
      <MenuBar
        onSave={handleSave}
        onLoad={handleLoad}
        onToggleDisplayMode={handleToggleDisplayMode}
      />
      <div className="flex-1 flex min-h-0">
        <ControlPanel
          onAddVertexManual={handleAddVertexManual}
          onAddVertexRandom={handleAddVertexRandom}
          onColorLastVertex={handleColorLastVertex}
          onToggleDisplayMode={handleToggleDisplayMode}
          onJumpToState={handleJumpToState}
          graph={graph}
        />
        <div className="flex-1 p-8">
          <GraphCanvas graph={graph} displayMode={displayMode} setDimensions={setDimensions} dimensions={dimensions} />
        </div>
      </div>
      <StatusBar message={status} graph={graph} />

      {/* Help Overlay */}
      {isHelpVisible && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-800">Keyboard Shortcuts</h2>
              <button
                onClick={() => setIsHelpVisible(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-600 mb-2">Graph Operations</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Start New Graph</span>
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">S</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Add Manual Vertex</span>
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">A,1-3</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Add Random Vertex</span>
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">R</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-600 mb-2">Display Controls</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Color Last Vertex</span>
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">C</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Toggle Labels</span>
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">T</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Jump to State</span>
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">G34</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  Press <span className="font-mono bg-slate-100 px-1 rounded">?</span> to toggle this help overlay
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
