const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  setAlwaysOnTop: (isPinned) => ipcRenderer.send('window-toggle-pin', isPinned),
  setOpacity: (opacityPercent) => ipcRenderer.send('window-set-opacity', opacityPercent),
  setClickThrough: (isEnabled) => ipcRenderer.send('window-set-click-through', isEnabled),
});
