import React, { useState } from 'react';
import PropTypes from 'prop-types';

const MenuBar = ({ onSave, onLoad, onToggleDisplayMode }) => {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);

  const closeAllMenus = () => {
    setIsFileMenuOpen(false);
    setIsViewMenuOpen(false);
    setIsHelpMenuOpen(false);
  };

  const shortcuts = [
    { key: 'S', description: 'Start new graph with triangle (V1, V2, V3)' },
    { key: 'A,1-3', description: 'Add vertex connected to specified periphery vertices' },
    { key: 'R', description: 'Add random vertex to periphery' },
    { key: 'C', description: 'Color the latest vertex' },
    { key: 'T', description: 'Toggle between vertex order/color number' },
    { key: 'G34', description: 'Jump to graph state (e.g., G34 shows up to vertex 34)' }
  ];

  return (
    <div className="h-14 bg-white shadow-sm border-b border-slate-200 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 h-full">
        <div className="flex items-center h-full gap-8">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Graph Editor
            </span>
          </div>

          {/* Menu Items */}
          <div className="flex items-center space-x-2">
            {/* File Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  closeAllMenus();
                  setIsFileMenuOpen(!isFileMenuOpen);
                }}
                className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors duration-150 font-medium"
              >
                File
              </button>
              {isFileMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1">
                  <button
                    onClick={() => {
                      onSave();
                      closeAllMenus();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Graph
                  </button>
                  <button
                    onClick={() => {
                      onLoad();
                      closeAllMenus();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Load Graph
                  </button>
                </div>
              )}
            </div>

            {/* View Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  closeAllMenus();
                  setIsViewMenuOpen(!isViewMenuOpen);
                }}
                className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors duration-150 font-medium"
              >
                View
              </button>
              {isViewMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1">
                  <button
                    onClick={() => {
                      onToggleDisplayMode();
                      closeAllMenus();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Toggle Labels (T)
                  </button>
                </div>
              )}
            </div>

            {/* Help Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  closeAllMenus();
                  setIsHelpMenuOpen(!isHelpMenuOpen);
                }}
                className="px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors duration-150 font-medium"
              >
                Help
              </button>
              {isHelpMenuOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-md shadow-lg border border-slate-200 py-1">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Keyboard Shortcuts</h3>
                    <div className="space-y-2">
                      {shortcuts.map(({ key, description }) => (
                        <div key={key} className="flex items-center text-sm">
                          <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 font-mono text-xs mr-2 min-w-[60px] text-center">
                            {key}
                          </span>
                          <span className="text-slate-600">{description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors duration-200 flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Node
            </button>
            <button className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors duration-200 flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

MenuBar.propTypes = {
  onSave: PropTypes.func.isRequired,
  onLoad: PropTypes.func.isRequired,
  onToggleDisplayMode: PropTypes.func.isRequired,
};

export default MenuBar; 