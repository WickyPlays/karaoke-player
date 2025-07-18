import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  quitApp: () => {
    ipcRenderer.send('close-app');
  },
  getAppPath: () => {
    return ipcRenderer.invoke('get-app-path');
  },
  createFolder: (dir: string) => {
    return ipcRenderer.invoke('create-folder', dir);
  },
  openDirectory: (dir: string) => {
    return ipcRenderer.invoke('open-directory', dir);
  },
  pickDirectory: () => {
    return ipcRenderer.invoke('pick-directory');
  },
  openFile: (filePath: string) => {
    return ipcRenderer.invoke('open-file', filePath);
  },
  readFile: (filePath: string) => {
    return ipcRenderer.invoke('read-file', filePath);
  },
  readTextFile: (filePath: string) => {
    return ipcRenderer.invoke('read-text-file', filePath);
  },
  getFileURL: (filePath: string) => {
    return ipcRenderer.invoke('get-file-url', filePath);
  }
});
