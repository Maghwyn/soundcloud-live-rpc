import { app, BrowserWindow, Menu, ipcMain, IpcMainEvent } from 'electron';
import { join, dirname } from 'node:path';

import { RPCClient } from './rpc-client';
import { config } from './config';

let mainWindow: BrowserWindow | null;

async function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1280,
		height: 720,
		icon: join(dirname(__dirname), 'assets/ico/soundcloud-mac.ico'),
		webPreferences: {
			preload: join(__dirname, 'preload.js'),
		},
	});

	// Load the SoundCloud website
	mainWindow.loadURL(config.startUrl);

	// Emitted when the window is closed.
	mainWindow.on('closed', () => {
		mainWindow = null;
	});

	ipcMain.on('retry-login', () => {
		RPCClient.setup();
	});

	ipcMain.on('clear-presence', () => {
		RPCClient.clearActivity();
	});

	ipcMain.on('set-player', (_: IpcMainEvent, isPlaying: boolean) => {
		RPCClient.setPresenceStatus(isPlaying);
	});

	ipcMain.on(
		'set-track-image',
		(_: IpcMainEvent, author: string, title: string, url: string, imageUrl: string) => {
			RPCClient.setPresenceTrackData(author, title, url, imageUrl);
		},
	);

	ipcMain.on('set-track-time', (_: IpcMainEvent, time: string, duration: string) => {
		RPCClient.setPresenceTrackTime(parseInt(time), parseInt(duration));
	});

	ipcMain.once('player-active', async () => {
		// Observer for the play button
		await mainWindow.webContents.executeJavaScript(`
			(async () => {
				try {
					const playControlsPlay = await waitForElement('.playControls__play', 5000);

					const observerPlayControlPlay = new MutationObserver(window.electronAPI.setPlayer);
					observerPlayControlPlay.observe(playControlsPlay, { attributes: true });
					window.electronAPI.setPlayer();
				} catch (err) {
					window.alert(err.message);
				}
			})()
		`);

		// Observer for the track data
		await mainWindow.webContents.executeJavaScript(`
			(async () => {
				try {
					const playbackSoundBadge = await waitForElement('.playbackSoundBadge', 5000);
				
					const observerSoundBadge = new MutationObserver(window.electronAPI.setTrackData);
					observerSoundBadge.observe(playbackSoundBadge, { childList: true, subtree: true });
					window.electronAPI.setTrackData();
				} catch (err) {
					window.alert(err.message);
				}
			})()
		`);

		// Observer for the track drag
		await mainWindow.webContents.executeJavaScript(`
			(async () => {
				try {
					const playbackTimeline = await waitForElement('div.playbackTimeline', 5000);

					const obserPlaybackTimeline = new MutationObserver(window.electronAPI.onTrackDrag);
					obserPlaybackTimeline.observe(playbackTimeline, { attributes: true });
				} catch (err) {
					window.alert(err.message);
				}
			})()
		`);
	});

	// Wait for the page to fully load
	mainWindow.webContents.on('did-finish-load', async () => {
		// Generic function to wait for an element and load the rpcButton stylsheet
		await mainWindow.webContents.executeJavaScript(`
			async function waitForElement(selector, maxWaitTime, isInfinite = false) {
				const startTime = Date.now();
			
				while (document.querySelector(selector) === null) {
					await new Promise(resolve => setTimeout(resolve, 1000));
			
					if (Date.now() - startTime > maxWaitTime && !isInfinite) {
						throw new Error('Timeout: Element not found within the maxWaitTime');
					}
				}
			
				return document.querySelector(selector);
			}

			window.rpcButton.loadCSS();
		`);

		// We await the player to be activated.
		//! WARNING: It's an infinite wait.
		await mainWindow.webContents.executeJavaScript(`
			(async () => {
				function sendOnPlayerActive() {
					const playerControlElement = document.querySelector('div.playControls');

					if (playerControlElement) {
						const isActive = playerControlElement.classList.contains('m-visible');
						
						if (isActive) {
							window.electronAPI.onPlayerActive();
						}
					}
				}

				try {
					const playControls = await waitForElement('div.playControls', 0, true);

					const observerPlayControls = new MutationObserver(sendOnPlayerActive);
					observerPlayControls.observe(playControls, { attributes: true });
					sendOnPlayerActive();
				} catch (err) {
					window.alert(err.message);
				}
			})()
		`);
	});
}

Menu.setApplicationMenu(null);

// Handle the client timeout and clear the presence
RPCClient.on('timeout', async () => {
	await mainWindow.webContents.executeJavaScript(`
		window.rpcButton.show();
		window.electronAPI.onClearPresence();
	`);
});

RPCClient.on('connected', async () => {
	await mainWindow.webContents.executeJavaScript(`
		window.rpcButton.hide();
		window.electronAPI.setPlayer();
		window.electronAPI.setTrackData();
	`);
});

// When Electron has finished initializing, create the main window
app.on('ready', createWindow);

// Quit the app when all windows are closed, unless running on macOS (where it's typical to leave apps running)
app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

// When the app is activated, create the main window if it doesn't already exist
app.on('activate', function () {
	if (mainWindow === null) {
		createWindow();
	}
});
