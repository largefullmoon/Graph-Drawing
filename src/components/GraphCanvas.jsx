import React, { useState, useRef, useEffect } from "react";

// Color palette (user can assign later)
const COLOR_PALETTE = [
  "#f43f5e", // 1 - Red
  "#3b82f6", // 2 - Blue
  "#10b981", // 3 - Green
  "#f59e42", // 4 - Orange
];

// Utility: get color by number (1-4)
function getColor(num) {
  return COLOR_PALETTE[(num - 1) % COLOR_PALETTE.length];
}

// Utility: fixed radius for all vertices (same size)
function getVertexRadius(label) {
  return 14; // Fixed size for all vertices, smaller than the original base of 16
}

// Improved getPeriphery: robustly finds the outer face using proper planar graph traversal
function getPeriphery(vertices, edges) {
  if (vertices.length < 3) return [];
  if (vertices.length === 3) return [0, 1, 2]; // Triangle case

  // Build adjacency list with edge directions
  const adj = vertices.map(() => []);
  edges.forEach(([a, b]) => {
    adj[a].push(b);
    adj[b].push(a);
  });

  // Find the leftmost vertex (guaranteed to be on periphery)
  let start = 0;
  vertices.forEach((v, i) => {
    if (v.pos.x < vertices[start].pos.x ||
      (v.pos.x === vertices[start].pos.x && v.pos.y < vertices[start].pos.y)) {
      start = i;
    }
  });

  // Sort neighbors by angle from the starting vertex
  function sortNeighborsByAngle(vertexIdx) {
    const neighbors = adj[vertexIdx];
    const vertex = vertices[vertexIdx];

    return neighbors.sort((a, b) => {
      const angleA = Math.atan2(
        vertices[a].pos.y - vertex.pos.y,
        vertices[a].pos.x - vertex.pos.x
      );
      const angleB = Math.atan2(
        vertices[b].pos.y - vertex.pos.y,
        vertices[b].pos.x - vertex.pos.x
      );
      return angleA - angleB;
    });
  }

  // Traverse the outer face
  const periphery = [];
  const visited = new Set();
  let current = start;
  let prevVertex = null;

  do {
    periphery.push(current);
    visited.add(current);

    const sortedNeighbors = sortNeighborsByAngle(current);
    let nextVertex = null;

    if (prevVertex === null) {
      // First step: choose the neighbor with the smallest angle (most counter-clockwise)
      nextVertex = sortedNeighbors[0];
    } else {
      // Find the next vertex in counter-clockwise order from the previous vertex
      const prevIndex = sortedNeighbors.indexOf(prevVertex);
      if (prevIndex !== -1) {
        // Choose the next vertex in counter-clockwise order
        nextVertex = sortedNeighbors[(prevIndex + 1) % sortedNeighbors.length];
      } else {
        // Fallback: choose the first neighbor
        nextVertex = sortedNeighbors[0];
      }
    }

    if (nextVertex === null || nextVertex === start) break;

    prevVertex = current;
    current = nextVertex;

  } while (current !== start && periphery.length < vertices.length);

  return periphery;
}

// Utility: get next available vertex id (order)
function getNextVertexId(vertices) {
  if (vertices.length === 0) return 1;
  return Math.max(...vertices.map((v) => v.id)) + 1;
}

// Utility: check if two line segments (p1-p2, q1-q2) cross
function doLinesIntersect(p1, p2, q1, q2) {
  function ccw(a, b, c) {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
  }
  return (
    ccw(p1, q1, q2) !== ccw(p2, q1, q2) &&
    ccw(p1, p2, q1) !== ccw(p1, p2, q2)
  );
}

// Utility: check if a new edge (from, to) would cross any existing edge
function edgeWouldCross(vertices, edges, fromIdx, toIdx, newPos) {
  const from = fromIdx === "new" ? newPos : vertices[fromIdx].pos;
  const to = toIdx === "new" ? newPos : vertices[toIdx].pos;
  for (let [a, b] of edges) {
    if (
      a === fromIdx ||
      a === toIdx ||
      b === fromIdx ||
      b === toIdx
    )
      continue;
    const pa = vertices[a].pos;
    const pb = vertices[b].pos;
    if (!pa || !pb) continue;
    if (doLinesIntersect(from, to, pa, pb)) return true;
  }
  return false;
}

// Move this outside the loop in `findValidPosition`
function isPointInsideTriangle(p, [a, b, c]) {
  const area = (p1, p2, p3) =>
    Math.abs(
      (p1.x * (p2.y - p3.y) +
        p2.x * (p3.y - p1.y) +
        p3.x * (p1.y - p2.y)) / 2
    );
  const A = area(a, b, c);
  const A1 = area(p, b, c);
  const A2 = area(a, p, c);
  const A3 = area(a, b, p);
  return Math.abs(A - (A1 + A2 + A3)) < 0.01;
}

// Simplified and more robust position finding for natural construction
function findValidPosition(vertices, edges, peripheryIndices, width, height) {
  if (peripheryIndices.length < 2) return null;

  // Calculate the centroid of the selected periphery segment
  const segmentVertices = peripheryIndices.map(idx => vertices[idx]);
  const centroid = segmentVertices.reduce(
    (acc, v) => ({
      x: acc.x + v.pos.x / segmentVertices.length,
      y: acc.y + v.pos.y / segmentVertices.length
    }),
    { x: 0, y: 0 }
  );

  // For natural construction, we want to place the vertex "outside" the current graph
  // Calculate the direction perpendicular to the segment and pointing outward
  let direction = { x: 0, y: 0 };

  if (peripheryIndices.length === 2) {
    // For edge case, place vertex perpendicular to the edge
    const [idx1, idx2] = peripheryIndices;
    const v1 = vertices[idx1].pos;
    const v2 = vertices[idx2].pos;

    // Vector along the edge
    const edgeVector = { x: v2.x - v1.x, y: v2.y - v1.y };

    // Perpendicular vector (rotated 90 degrees)
    const perpVector = { x: -edgeVector.y, y: edgeVector.x };

    // Normalize
    const length = Math.sqrt(perpVector.x * perpVector.x + perpVector.y * perpVector.y);
    if (length > 0) {
      direction = { x: perpVector.x / length, y: perpVector.y / length };
    }

    // Determine which side is "outside" by checking if moving in this direction
    // takes us away from other vertices
    const testPoint = {
      x: centroid.x + direction.x * 50,
      y: centroid.y + direction.y * 50
    };

    let avgDistanceToOthers = 0;
    let count = 0;
    vertices.forEach((v, i) => {
      if (!peripheryIndices.includes(i)) {
        avgDistanceToOthers += Math.hypot(testPoint.x - v.pos.x, testPoint.y - v.pos.y);
        count++;
      }
    });

    if (count > 0) {
      avgDistanceToOthers /= count;

      // Test the opposite direction
      const oppositePoint = {
        x: centroid.x - direction.x * 50,
        y: centroid.y - direction.y * 50
      };

      let avgDistanceOpposite = 0;
      vertices.forEach((v, i) => {
        if (!peripheryIndices.includes(i)) {
          avgDistanceOpposite += Math.hypot(oppositePoint.x - v.pos.x, oppositePoint.y - v.pos.y);
        }
      });
      avgDistanceOpposite /= count;

      // Choose the direction that maximizes distance to other vertices
      if (avgDistanceOpposite > avgDistanceToOthers) {
        direction = { x: -direction.x, y: -direction.y };
      }
    }
  } else {
    // For segments with more than 2 vertices, use the normal to the segment
    // pointing away from the graph center
    const graphCenter = vertices.reduce(
      (acc, v) => ({
        x: acc.x + v.pos.x / vertices.length,
        y: acc.y + v.pos.y / vertices.length
      }),
      { x: 0, y: 0 }
    );

    direction = {
      x: centroid.x - graphCenter.x,
      y: centroid.y - graphCenter.y
    };

    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    if (length > 0) {
      direction = { x: direction.x / length, y: direction.y / length };
    } else {
      direction = { x: 1, y: 0 }; // Default direction
    }
  }

  // Try different distances along the direction
  const distances = [60, 40, 80, 100, 120, 140, 160, 180, 200];

  for (const distance of distances) {
    const candidate = {
      x: centroid.x + direction.x * distance,
      y: centroid.y + direction.y * distance
    };

    // Check bounds
    if (candidate.x < 30 || candidate.x > width - 30 ||
      candidate.y < 30 || candidate.y > height - 30) {
      continue;
    }

    // Check minimum distance to existing vertices
    const minDistance = 44; // Minimum distance between vertices
    let tooClose = false;
    for (const v of vertices) {
      if (Math.hypot(candidate.x - v.pos.x, candidate.y - v.pos.y) < minDistance) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    // Check for edge crossings
    let wouldCross = false;
    for (const idx of peripheryIndices) {
      const edgeStart = vertices[idx].pos;
      const edgeEnd = candidate;

      for (const [a, b] of edges) {
        // Skip edges that share a vertex with our new edges
        if (peripheryIndices.includes(a) || peripheryIndices.includes(b)) continue;

        const p1 = vertices[a].pos;
        const p2 = vertices[b].pos;

        if (doLinesIntersect(edgeStart, edgeEnd, p1, p2)) {
          wouldCross = true;
          break;
        }
      }
      if (wouldCross) break;
    }

    if (!wouldCross) {
      return candidate;
    }
  }

  return null;
}

// Utility: parse "A, 1-3" or "A, 2,4" etc. (must be consecutive for natural construction)
function parseAddCommand(cmd, periphery) {
  const m = cmd.match(/^A,\s*([\d,\-\s]+)$/i);
  if (!m) return null;
  const arg = m[1].replace(/\s/g, "");
  let indices = [];
  if (arg.includes("-")) {
    const [start, end] = arg.split("-").map(Number);
    if (start > end) return null; // Invalid range
    for (let i = start; i <= end; ++i) indices.push(i);
  } else {
    indices = arg.split(",").map(Number);
  }

  // Map periphery order numbers to actual vertex indices
  const peripheryMap = periphery.map((idx, i) => ({ idx, order: i + 1 }));
  const selected = peripheryMap.filter((v) => indices.includes(v.order));

  if (selected.length < 2) return null; // Need at least 2 vertices for natural construction

  // Check that the selected vertices form a consecutive segment
  const orders = selected.map((v) => v.order).sort((a, b) => a - b);

  // Handle wrap-around case (e.g., vertices 1, 2, 3, ..., n, where we select n, 1, 2)
  let isConsecutive = true;

  // First check if it's a simple consecutive sequence
  for (let i = 1; i < orders.length; ++i) {
    if (orders[i] !== orders[i - 1] + 1) {
      isConsecutive = false;
      break;
    }
  }

  // If not consecutive, check for wrap-around
  if (!isConsecutive && orders.length > 1) {
    // Check if this could be a wrap-around sequence
    const maxOrder = periphery.length;
    const minOrder = 1;

    // Sort the orders and check if they wrap around
    const sortedOrders = [...orders].sort((a, b) => a - b);

    // Check if we have a sequence that wraps around (e.g., [1, 2, 7, 8] in an 8-vertex periphery)
    if (sortedOrders[0] === minOrder && sortedOrders[sortedOrders.length - 1] === maxOrder) {
      // Check if the beginning and end form consecutive sequences
      let validWrapAround = true;

      // Find the break point
      let breakPoint = -1;
      for (let i = 1; i < sortedOrders.length; i++) {
        if (sortedOrders[i] !== sortedOrders[i - 1] + 1) {
          if (breakPoint === -1) {
            breakPoint = i;
          } else {
            // Multiple breaks, not a valid wrap-around
            validWrapAround = false;
            break;
          }
        }
      }

      if (validWrapAround && breakPoint !== -1) {
        // Check if the two parts are at the beginning and end
        const firstPart = sortedOrders.slice(0, breakPoint);
        const secondPart = sortedOrders.slice(breakPoint);

        // First part should start at 1, second part should end at maxOrder
        if (firstPart[0] === minOrder && secondPart[secondPart.length - 1] === maxOrder) {
          isConsecutive = true;
        }
      }
    }
  }

  if (!isConsecutive) return null;

  return selected.map((v) => v.idx);
}

// Utility: parse "G34" (draw up to vertex 34)
function parseGCommand(cmd) {
  const m = cmd.match(/^G(\d+)$/i);
  if (!m) return null;
  return parseInt(m[1], 10);
}

// Utility: color algorithm placeholder (user will provide)
function colorVertex(vertices, edges, idx, palette) {
  const neighbors = edges
    .filter(([a, b]) => a === idx || b === idx)
    .map(([a, b]) => (a === idx ? b : a));
  const used = new Set(
    neighbors
      .map((i) => vertices[i].color)
      .filter((c) => c !== undefined && c !== null)
  );
  for (let c = 1; c <= palette.length; ++c) {
    if (!used.has(c)) return c;
  }
  return 1;
}

// Utility: save graph as JSON
function saveGraph(vertices, edges, colors) {
  const data = {
    vertices: vertices.map((v) => ({
      id: v.id,
      color: v.color,
      pos: v.pos,
    })),
    edges,
    colors,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "graph.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Utility: load graph from file
function loadGraphFromFile(file, setGraph) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (
        data.vertices &&
        data.edges &&
        Array.isArray(data.vertices) &&
        Array.isArray(data.edges)
      ) {
        setGraph({
          vertices: data.vertices.map((v) => ({
            id: v.id,
            color: v.color,
            pos: v.pos,
          })),
          edges: data.edges,
          colors: data.colors || [1, 2, 3, 4],
        });
      }
    } catch (e) {
      alert("Invalid graph file.");
    }
  };
  reader.readAsText(file);
}

// Utility: shuffle an array (Fisher-Yates)
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Helper: Check if all vertices in a segment are fully connected
function isFullyConnected(vertices, edges, segment) {
  const edgeSet = new Set(edges.map(([a, b]) =>
    a < b ? `${a}-${b}` : `${b}-${a}`
  ));
  for (let i = 0; i < segment.length; ++i) {
    for (let j = i + 1; j < segment.length; ++j) {
      const a = segment[i], b = segment[j];
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!edgeSet.has(key)) return false;
    }
  }
  return true;
}

// Add vertex to segment, ensuring full connectivity and auto-linking internal vertices
function addVertexToSegment(prev, connectTo, pos) {
  // 1. Ensure segment is fully connected
  if (!isFullyConnected(prev.vertices, prev.edges, connectTo)) {
    return null;
  }

  const newIdx = prev.vertices.length;
  const newVertices = [...prev.vertices, {
    id: getNextVertexId(prev.vertices),
    color: null,
    pos
  }];
  const newEdges = [...prev.edges];

  // 2. Connect new vertex to all segment vertices
  connectTo.forEach(idx => newEdges.push([newIdx, idx]));

  // 3. Close the cycle among segment vertices
  for (let i = 0; i < connectTo.length; i++) {
    const a = connectTo[i];
    const b = connectTo[(i + 1) % connectTo.length];
    if (!newEdges.some(([x, y]) =>
      (x === a && y === b) || (x === b && y === a)
    )) {
      newEdges.push([a, b]);
    }
  }

  const edgeSet = new Set(newEdges.map(([a, b]) =>
    a < b ? `${a}-${b}` : `${b}-${a}`
  ));

  // 4. Connect internal vertices properly:
  //    - Detect vertices inside any new triangle (segment edge + new vertex)
  //    - Link them *to all three vertices*: segment endpoints *and* new vertex
  const segmentEdges = [];
  for (let i = 0; i < connectTo.length; i++) {
    segmentEdges.push([connectTo[i], connectTo[(i + 1) % connectTo.length]]);
  }

  segmentEdges.forEach(([aI, bI]) => {
    const pA = prev.vertices[aI].pos;
    const pB = prev.vertices[bI].pos;
    const pC = pos; // new vertex

    prev.vertices.forEach((v, vi) => {
      if (vi === aI || vi === bI || vi === newIdx) return;

      if (isPointInsideTriangle(v.pos, [pA, pB, pC])) {
        // Connect internal vertex vi to all three: aI, bI, newIdx
        [[aI, vi], [bI, vi], [newIdx, vi]].forEach(([x, y]) => {
          const k = x < y ? `${x}-${y}` : `${y}-${x}`;
          if (!edgeSet.has(k)) {
            newEdges.push([x, y]);
            edgeSet.add(k);
          }
        });
      }
    });
  });

  return { newVertices, newEdges };
}

const GraphCanvas = () => {
  const [graph, setGraph] = useState({
    vertices: [],
    edges: [],
    colors: [1, 2, 3, 4],
  });
  const [displayMode, setDisplayMode] = useState("order");
  const [gLimit, setGLimit] = useState(null);
  const fileInputRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const svgRef = useRef();
  const [warning, setWarning] = useState("");
  const [cmd, setCmd] = useState("");

  useEffect(() => {
    function updateSize() {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Robust random vertex addition: try all possible consecutive segments
  function tryAddRandomVertex() {
    setGraph(prev => {
      if (prev.vertices.length < 3) return prev;
      const periph = getPeriphery(prev.vertices, prev.edges);
      if (periph.length < 2) return prev;

      // For natural construction, we need to choose a consecutive segment of the periphery
      // The new vertex must connect to at least 2 vertices (as per the document)

      // Try different segment lengths (2, 3, 4, etc.)
      const maxSegmentLength = Math.min(periph.length, 5); // Don't make segments too long

      for (let segmentLength = 2; segmentLength <= maxSegmentLength; segmentLength++) {
        // Try all possible starting positions for segments of this length
        const shuffledStartIndices = shuffleArray([...Array(periph.length).keys()]);

        for (const startIdx of shuffledStartIndices) {
          // Create consecutive segment
          const connectTo = [];
          for (let i = 0; i < segmentLength; i++) {
            connectTo.push(periph[(startIdx + i) % periph.length]);
          }

          // Check if this segment is fully connected (required for natural construction)
          if (!isFullyConnected(prev.vertices, prev.edges, connectTo)) {
            continue; // Skip if not fully connected
          }

          // Find a valid position for the new vertex
          const pos = findValidPosition(prev.vertices, prev.edges, connectTo, dimensions.width, dimensions.height);
          if (!pos) {
            continue; // Try next segment
          }

          // Add the new vertex to the graph
          const result = addVertexToSegment(prev, connectTo, pos);
          if (result) {
            setWarning("");
            return { vertices: result.newVertices, edges: result.newEdges, colors: prev.colors };
          }
        }
      }

      // If no valid position is found with any segment, show warning
      setWarning("No valid position found — would cause edge-crossing or no fully connected periphery segment available.");
      return prev;
    });
  }

  useEffect(() => {
    function handleKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;
      if (e.key.toUpperCase() === "S") {
        setGLimit(null);
        setWarning("");
        const w = dimensions.width, h = dimensions.height;
        const R = Math.min(w, h) * 0.1;
        const cx = w / 2, cy = h / 2;
        const pos = [
          { x: cx, y: cy - R },
          { x: cx + R * Math.cos(Math.PI / 6), y: cy + R * Math.sin(Math.PI / 6) },
          { x: cx - R * Math.cos(Math.PI / 6), y: cy + R * Math.sin(Math.PI / 6) },
        ];
        setGraph({
          vertices: [
            { id: 1, color: null, pos: pos[0] },
            { id: 2, color: null, pos: pos[1] },
            { id: 3, color: null, pos: pos[2] },
          ],
          edges: [
            [0, 1],
            [1, 2],
            [2, 0],
          ],
          colors: [1, 2, 3, 4],
        });
      } else if (e.key.toUpperCase() === "R") {
        tryAddRandomVertex();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, [graph, displayMode, dimensions]);

  function handleCmdInput(e) {
    setCmd(e.target.value);
  }
  function handleCmdSubmit(e) {
    e.preventDefault();
    const val = cmd.trim().toUpperCase();
    setWarning("");
    if (val.startsWith("A,")) {
      setGraph(prev => {
        if (prev.vertices.length < 3) {
          setWarning("Need at least 3 vertices to add to periphery. Press S to start.");
          return prev;
        }
        const periph = getPeriphery(prev.vertices, prev.edges);
        if (periph.length < 2) {
          setWarning("Periphery too small - need at least 2 periphery vertices.");
          return prev;
        }

        const connectTo = parseAddCommand(val, periph);
        if (!connectTo || connectTo.length < 2) {
          setWarning("Invalid command. Use consecutive periphery vertices (e.g., 'A, 1-3' or 'A, 2,3,4'). Need at least 2 vertices for natural construction.");
          return prev;
        }

        // Validate that the segment is fully connected (required for natural construction)
        if (!isFullyConnected(prev.vertices, prev.edges, connectTo)) {
          setWarning("Selected vertices must be fully connected to each other for natural construction.");
          return prev;
        }

        const pos = findValidPosition(prev.vertices, prev.edges, connectTo, dimensions.width, dimensions.height);
        if (!pos) {
          setWarning("No valid position found - would cause edge crossings or invalid placement.");
          return prev;
        }

        const result = addVertexToSegment(prev, connectTo, pos);
        if (!result) {
          setWarning("Failed to add vertex - segment connectivity issue.");
          return prev;
        }

        setWarning(""); // Clear warning on success
        return { vertices: result.newVertices, edges: result.newEdges, colors: prev.colors };
      });
    } else if (val === "R") {
      tryAddRandomVertex();
    } else if (val === "C") {
      setGraph((prev) => {
        if (prev.vertices.length === 0) return prev;
        const idx = prev.vertices.length - 1;
        if (prev.vertices[idx].color) return prev;
        const color = colorVertex(prev.vertices, prev.edges, idx, prev.colors);
        const newVertices = prev.vertices.map((v, i) =>
          i === idx ? { ...v, color } : v
        );
        return { ...prev, vertices: newVertices };
      });
    } else if (val === "T") {
      setDisplayMode((m) => (m === "order" ? "color" : "order"));
    } else if (val === "V") {
      saveGraph(graph.vertices, graph.edges, graph.colors);
    } else if (val === "L") {
      fileInputRef.current && fileInputRef.current.click();
    } else if (val.startsWith("G")) {
      const n = parseGCommand(val);
      if (n && n > 0) setGLimit(n);
    }
    setCmd("");
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      loadGraphFromFile(file, setGraph);
    }
    e.target.value = "";
  }

  let verticesToDraw = graph.vertices;
  let edgesToDraw = graph.edges;
  if (gLimit !== null) {
    verticesToDraw = graph.vertices.filter((v) => v.id <= gLimit);
    const idxSet = new Set(verticesToDraw.map((v, i) => i));
    edgesToDraw = graph.edges.filter(
      ([a, b]) => idxSet.has(a) && idxSet.has(b)
    );
  }

  function getVertexLabel(v, i) {
    if (displayMode === "order") return v.id;
    if (v.color) return v.color;
    return v.id;
  }
  function getVertexFill(v) {
    if (v.color) return getColor(v.color);
    return "#fff";
  }
  function getRadius(v) {
    return getVertexRadius(getVertexLabel(v));
  }
  function isPeriphery(i) {
    const periph = getPeriphery(verticesToDraw, edgesToDraw);
    return periph.includes(i);
  }
  function getPath(a, b) {
    const p1 = verticesToDraw[a].pos;
    const p2 = verticesToDraw[b].pos;
    return `M${p1.x},${p1.y} L${p2.x},${p2.y}`;
  }
  function getEdgeColor(a, b) {
    return "#64748b";
  }
  function getEdgeWidth(a, b) {
    return 3;
  }
  function getEdgeOpacity(a, b) {
    return 0.85;
  }
  function getVertexStroke(i) {
    return isPeriphery(i) ? "#f59e42" : "#64748b";
  }
  function getVertexStrokeWidth(i) {
    return isPeriphery(i) ? 4 : 2;
  }
  function getVertexTextColor(v) {
    if (v.color) return "#fff";
    return "#334155";
  }
  function getVertexFontWeight(v) {
    return "bold";
  }
  function getVertexFontSize(v) {
    return 16 + Math.max(0, getVertexLabel(v).toString().length - 1) * 2;
  }
  function renderHelp() {
    return (
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 12,
          background: "rgba(255,255,255,0.92)",
          borderRadius: 10,
          padding: "10px 18px",
          fontSize: 15,
          color: "#334155",
          boxShadow: "0 2px 8px #0001",
          zIndex: 10,
        }}
      >
        {/* <b>Natural Construction Controls:</b>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            <b>S</b>: Start with triangle (3 vertices)
          </li>
          <li>
            <b>A, 1-3</b>: Add vertex to consecutive periphery vertices 1,2,3
          </li>
          <li>
            <b>A, 2,3</b>: Add vertex connecting to periphery vertices 2,3
          </li>
          <li>
            <b>R</b>: Add random vertex to periphery (follows natural construction)
          </li>
          <li>
            <b>C</b>: Color last added vertex
          </li>
          <li>
            <b>T</b>: Toggle label (order/color)
          </li>
          <li>
            <b>V</b>: Save graph as JSON
          </li>
          <li>
            <b>L</b>: Load graph from JSON
          </li>
          <li>
            <b>G34</b>: Show only vertices up to #34
          </li>
        </ul>
        <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>
          <b>Periphery:</b> Orange outlined vertices form the outer boundary
        </div>
        <form onSubmit={handleCmdSubmit} style={{ marginTop: 8 }}>
          <input
            type="text"
            value={cmd}
            onChange={handleCmdInput}
            placeholder='Type command (e.g. "A, 1-3", "R")'
            style={{
              fontSize: 15,
              padding: "3px 8px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              outline: "none",
              width: 200,
            }}
          />
          <button
            type="submit"
            style={{
              marginLeft: 8,
              fontSize: 15,
              padding: "3px 12px",
              borderRadius: 6,
              border: "1px solid #cbd5e1",
              background: "#f1f5f9",
              cursor: "pointer",
            }}
          >
            OK
          </button>
        </form>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept=".json"
          onChange={handleFileChange}
        />
        {warning && (
          <div
            style={{
              color: "#b91c1c",
              marginTop: 8,
              fontWeight: 500,
              fontSize: 15,
            }}
          >
            {warning}
          </div>
        )} */}
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 400,
        minWidth: 400,
        position: "relative",
        background: "linear-gradient(120deg,#f1f5f9 60%,#e0e7ef 100%)",
        borderRadius: 18,
        boxShadow: "0 2px 16px #0001",
        overflow: "hidden",
      }}
    >
      {renderHelp()}
      {/* Scrollable SVG container */}
      <div
        style={{
          width: "100%",
          height: "100%",
          maxWidth: 1200,
          maxHeight: 900,
          minWidth: 400,
          minHeight: 400,
          overflow: "auto",
          borderRadius: 12,
          background: "none",
          boxShadow: "0 1px 4px #0001",
          margin: "0 auto",
        }}
      >
        <svg
          ref={svgRef}
          width={Math.max(dimensions.width, graph.vertices.length > 100 ? 2000 : 800)}
          height={Math.max(dimensions.height, graph.vertices.length > 100 ? 1500 : 600)}
          viewBox={`0 0 ${Math.max(dimensions.width, graph.vertices.length > 100 ? 2000 : 800)} ${Math.max(dimensions.height, graph.vertices.length > 100 ? 1500 : 600)}`}
          style={{
            display: "block",
            background: "none",
          }}
        >
          {edgesToDraw.map(([a, b], i) => {
            if (!verticesToDraw[a] || !verticesToDraw[b]) return null;
            return (
              <path
                key={`e${a}-${b}-${i}`}
                d={getPath(a, b)}
                stroke={getEdgeColor(a, b)}
                strokeWidth={getEdgeWidth(a, b)}
                strokeOpacity={getEdgeOpacity(a, b)}
                fill="none"
                style={{
                  filter: "drop-shadow(0 1px 2px #0002)",
                  transition: "all 0.3s",
                }}
              />
            );
          })}
          {verticesToDraw.map((v, i) => {
            if (!v.pos) return null;
            const r = getRadius(v);
            return (
              <g key={`v${i}`}>
                <circle
                  cx={v.pos.x}
                  cy={v.pos.y}
                  r={r + 4}
                  fill="#fff"
                  stroke={getVertexStroke(i)}
                  strokeWidth={getVertexStrokeWidth(i)}
                  style={{
                    filter: isPeriphery(i)
                      ? "drop-shadow(0 0 8px #f59e42aa)"
                      : "drop-shadow(0 1px 2px #0002)",
                    transition: "all 0.3s",
                  }}
                />
                <circle
                  cx={v.pos.x}
                  cy={v.pos.y}
                  r={r}
                  fill={getVertexFill(v)}
                  stroke="#64748b"
                  strokeWidth={2}
                  style={{
                    filter: "drop-shadow(0 1px 2px #0002)",
                    transition: "all 0.3s",
                  }}
                />
                <text
                  x={v.pos.x}
                  y={v.pos.y + 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontWeight={getVertexFontWeight(v)}
                  fontSize={getVertexFontSize(v)}
                  fill={getVertexTextColor(v)}
                  style={{
                    pointerEvents: "none",
                    userSelect: "none",
                    transition: "all 0.3s",
                  }}
                >
                  {getVertexLabel(v, i)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {graph.vertices.length === 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            fontSize: 28,
            fontWeight: 500,
            background: "rgba(255,255,255,0.7)",
            zIndex: 2,
          }}
        >
          Press <b>S</b> to start
        </div>
      )}
    </div>
  );
};

export default GraphCanvas;
