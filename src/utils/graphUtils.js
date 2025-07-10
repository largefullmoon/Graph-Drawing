// Graph utility functions
export const COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'cyan'];

// Add vertex with random connections to periphery
export function addVertexRandom(graph, dimensions) {
  if (!graph || !graph.periphery || graph.periphery.length === 0) {
    return graph;
  }

  const newId = graph.vertices.length + 1;
  const numConnections = Math.min(
    Math.floor(Math.random() * 3) + 1, // 1-3 connections
    graph.periphery.length
  );

  // Select random periphery vertices
  const shuffledPeriphery = [...graph.periphery].sort(() => Math.random() - 0.5);
  const connectTo = shuffledPeriphery.slice(0, numConnections);

  // Create new vertex
  const newVertex = {
    id: newId,
    x: Math.random() * (dimensions.width - 100) + 50,
    y: Math.random() * (dimensions.height - 100) + 50,
    fx: null,
    fy: null
  };

  // Create new edges
  const newEdges = connectTo.map(id => [newId, id]);

  // Update periphery (remove vertices that are no longer on the periphery)
  const newPeriphery = graph.periphery.filter(id => {
    const connections = [...graph.edges, ...newEdges]
      .filter(edge => edge[0] === id || edge[1] === id)
      .length;
    return connections < 3; // Still on periphery if less than 3 connections
  });

  // Add new vertex to periphery if it has less than 3 connections
  if (numConnections < 3) {
    newPeriphery.push(newId);
  }

  return {
    ...graph,
    vertices: [...graph.vertices, newVertex],
    edges: [...graph.edges, ...newEdges],
    periphery: newPeriphery,
    order: [...graph.order, newId]
  };
}

// Add vertex with manual connections
export function addVertexManual(graph, connectToIds) {
  if (!graph || !connectToIds || connectToIds.length === 0) {
    return graph;
  }

  // Validate that all IDs are in periphery
  const invalidIds = connectToIds.filter(id => !graph.periphery.includes(id));
  if (invalidIds.length > 0) {
    return graph;
  }

  const newId = graph.vertices.length + 1;

  // Create new vertex at center
  const newVertex = {
    id: newId,
    x: graph.vertices.reduce((sum, v) => sum + v.x, 0) / graph.vertices.length,
    y: graph.vertices.reduce((sum, v) => sum + v.y, 0) / graph.vertices.length,
    fx: null,
    fy: null
  };

  // Create new edges
  const newEdges = connectToIds.map(id => [newId, id]);

  // Update periphery
  const newPeriphery = graph.periphery.filter(id => {
    const connections = [...graph.edges, ...newEdges]
      .filter(edge => edge[0] === id || edge[1] === id)
      .length;
    return connections < 3;
  });

  // Add new vertex to periphery if it has less than 3 connections
  if (connectToIds.length < 3) {
    newPeriphery.push(newId);
  }

  return {
    ...graph,
    vertices: [...graph.vertices, newVertex],
    edges: [...graph.edges, ...newEdges],
    periphery: newPeriphery,
    order: [...graph.order, newId]
  };
}

// Color the last added vertex
export function colorLastVertex(graph) {
  if (!graph || !graph.order || graph.order.length === 0) {
    return graph;
  }

  const lastVertexId = graph.order[graph.order.length - 1];
  const color = assignColor(graph, lastVertexId);

  return {
    ...graph,
    colors: {
      ...graph.colors,
      [lastVertexId]: color
    }
  };
}

// Assign color to a vertex using graph coloring algorithm
function assignColor(graph, vertexId) {
  // Get neighbors of the vertex
  const neighbors = graph.edges
    .filter(edge => edge[0] === vertexId || edge[1] === vertexId)
    .map(edge => edge[0] === vertexId ? edge[1] : edge[0]);

  // Get colors used by neighbors
  const usedColors = neighbors
    .map(neighborId => graph.colors[neighborId])
    .filter(color => color !== undefined);

  // Find first available color
  for (let i = 0; i < COLORS.length; i++) {
    if (!usedColors.includes(COLORS[i])) {
      return COLORS[i];
    }
  }

  // If all colors are used, return the first one (shouldn't happen in proper graph coloring)
  return COLORS[0];
}

// Jump to a specific vertex state
export function jumpToVertex(graph, n) {
  if (!graph || !graph.order || n < 1) {
    return graph;
  }

  const targetN = Math.min(n, graph.order.length);
  const visibleVertexIds = graph.order.slice(0, targetN);

  return {
    ...graph,
    visibleVertices: visibleVertexIds,
    currentState: targetN
  };
}

// Export graph to JSON
export function exportGraph(graph) {
  return JSON.stringify({
    vertices: graph.vertices,
    edges: graph.edges,
    colors: graph.colors,
    order: graph.order,
    periphery: graph.periphery,
    currentState: graph.currentState || graph.vertices.length
  }, null, 2);
}

// Import graph from JSON
export function importGraph(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate required fields
    if (!data.vertices || !data.edges || !Array.isArray(data.vertices) || !Array.isArray(data.edges)) {
      return null;
    }

    return {
      vertices: data.vertices,
      edges: data.edges,
      colors: data.colors || {},
      order: data.order || data.vertices.map(v => v.id),
      periphery: data.periphery || [],
      currentState: data.currentState || data.vertices.length,
      visibleVertices: data.visibleVertices || data.vertices.map(v => v.id)
    };
  } catch (error) {
    console.error('Failed to import graph:', error);
    return null;
  }
}

// Initialize a new graph
export function initializeGraph() {
  // Start with a triangle
  const vertices = [
    { id: 1, x: 100, y: 100, fx: null, fy: null },
    { id: 2, x: 200, y: 100, fx: null, fy: null },
    { id: 3, x: 150, y: 200, fx: null, fy: null }
  ];

  const edges = [[1, 2], [2, 3], [3, 1]];

  return {
    vertices,
    edges,
    colors: {},
    order: [1, 2, 3],
    periphery: [1, 2, 3],
    currentState: 3,
    visibleVertices: [1, 2, 3]
  };
} 