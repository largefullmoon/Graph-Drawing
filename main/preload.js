import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveGraph: (data) => ipcRenderer.invoke('save-graph', data),
  loadGraph: () => ipcRenderer.invoke('load-graph'),
});
