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

	ipcMain.once('player-active', async (_: IpcMainEvent) => {
		// Observer for the play button
		await mainWindow.webContents.executeJavaScript(`
			(async () => {
				function sendPlayingStatus() {
					const playerElement = document.querySelector('.playControls__play');

					if (playerElement) {
						const isPlaying = playerElement.classList.contains('playing');
						window.electronAPI.setPlayer(isPlaying);
					}
				}

				try {
					const playControlsPlay = await waitForElement('.playControls__play', 5000);

					const observerControlPlay = new MutationObserver(sendPlayingStatus);
					observerControlPlay.observe(playControlsPlay, { attributes: true });
					sendPlayingStatus();
				} catch (err) {
					window.alert(err.message);
				}
			})()
		`);

		// Observer for the track data
		await mainWindow.webContents.executeJavaScript(`
			(async () => {
				function sendPlayingTrackData() {
					const authorElement = document.querySelector('.playbackSoundBadge__lightLink');
					const titleElement = document.querySelector('.playbackSoundBadge__titleLink');
					const spanElement = document.querySelector('.playbackSoundBadge__avatar .image__lightOutline span');

					if (authorElement && titleElement && spanElement) {
						const author = authorElement.textContent;
						const title = titleElement.querySelector('span:nth-child(2)').innerText;
						const url = titleElement.href;
						const imageUrl = spanElement.style.backgroundImage;
						window.electronAPI.setTrackData(author, title, url, imageUrl);
					}
				}

				try {
					const playbackSoundBadge = await waitForElement('.playbackSoundBadge', 5000);
				
					const observerControlPlay = new MutationObserver(sendPlayingTrackData);
					observerControlPlay.observe(playbackSoundBadge, { childList: true, subtree: true });
					sendPlayingTrackData();
				} catch (err) {
					window.alert(err.message);
				}
			})()
		`);

		// Observer for the track time
		await mainWindow.webContents.executeJavaScript(`
			(async () => {
				function sendPlayingTrackTime() {
					const progressWrapperElement = document.querySelector('.playbackTimeline__progressWrapper');

					if (progressWrapperElement) {
						const time = progressWrapperElement.getAttribute('aria-valuenow');
						const duration = progressWrapperElement.getAttribute('aria-valuemax');
						window.electronAPI.setTrackTime(time, duration);
					}
				}

				try {
					const playbackTimeline = await waitForElement('.playbackTimeline__progressWrapper', 5000);
				
					const observerControlPlay = new MutationObserver(sendPlayingTrackTime);
					observerControlPlay.observe(playbackTimeline, { attributes: true });
					sendPlayingTrackTime();
				} catch (err) {
					window.alert(err.message);
				}
			})()
		`);
	});

	// Wait for the page to fully load
	mainWindow.webContents.on('did-finish-load', async () => {
		// Generic function to wait for an element
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

// When the RPC client timeout, we exit the app.
RPCClient.once('timeout', () => {
	// TODO: Instead of exiting, perhaps show a notification of some sort in the top right corner
	process.exitCode = 1;
	app.exit(1);
})

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
