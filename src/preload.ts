import { contextBridge, ipcRenderer } from 'electron/renderer';

contextBridge.exposeInMainWorld('electronAPI', {
	setPlayer: (isPlaying: boolean) => ipcRenderer.send('set-player', isPlaying),
	setTrackData: (author: string, title: string, url: string, imageUrl: string) =>
		ipcRenderer.send('set-track-image', author, title, url, imageUrl),
	setTrackTime: (time: string, duration: string) =>
		ipcRenderer.send('set-track-time', time, duration),
});
