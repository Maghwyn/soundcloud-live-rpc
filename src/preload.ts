import { contextBridge, ipcRenderer } from 'electron/renderer';

contextBridge.exposeInMainWorld('electronAPI', {
	onPlayerActive: () => ipcRenderer.send('player-active'),
	setPlayer: (isPlaying: boolean) => ipcRenderer.send('set-player', isPlaying),
	setTrackData: (author: string, title: string, url: string, imageUrl: string) =>
		ipcRenderer.send('set-track-image', author, title, url, imageUrl),
	setTrackTime: (time: string, duration: string) =>
		ipcRenderer.send('set-track-time', time, duration),
	clearPresence: () => ipcRenderer.send('clear-presence'),
});

contextBridge.exposeInMainWorld('rpcButton', {
	loadCSS: () => {
		const css = `
			#reconnectButton {
				display: flex;
				justify-content: center;
				align-items: center;
				position: fixed;
				bottom: 60px;
				right: 10px;
				background-color: #ff5500;
				color: white;
				border: none;
				padding: 10px;
				cursor: pointer;
				z-index: 9999;
				border-radius: 0.5rem;
				width: 184px;
			}

			.shake {
				-webkit-animation: shake 4s cubic-bezier(0.455, 0.030, 0.515, 0.955) infinite both;
				animation: shake 4s cubic-bezier(0.455, 0.030, 0.515, 0.955) infinite both;
			}
			
			@keyframes shake {
				0%,
				100% {
					transform: rotate(0deg);
					transform-origin: 50% 100%;
				}
				5% {
					transform: rotate(2deg);
				}
				10%,
				20%,
				30% {
					transform: rotate(-4deg);
				}
				15%,
				25%,
				35% {
					transform: rotate(4deg);
				}
				40% {
					transform: rotate(-2deg);
				}
				45% {
					transform: rotate(2deg);
				}
				50% {
					transform: rotate(0deg);
				}
			}

			.spinner {
				display: inline-block;
				width: 12px;
				height: 12px;
				border: 2px solid #fff;
				border-top: 2px solid #ff5500;
				border-radius: 50%;
				animation: spin 1s linear infinite;
			}
	
			@keyframes spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}
		`;

		document.head.insertAdjacentHTML("beforeend", `<style>${css}</style>`)
	},
	show: () => {
		const btn = document.getElementById('reconnectButton');

		if (!btn) {
			const reconnectButton = document.createElement('button');
			reconnectButton.id = 'reconnectButton';
			reconnectButton.textContent = 'Reconnect to Discord RPC';
			reconnectButton.classList.add('shake');
			document.body.appendChild(reconnectButton);

			reconnectButton.addEventListener('click', () => {
				if (reconnectButton.querySelector("span") !== null) return;

				reconnectButton.textContent = '';
				reconnectButton.classList.remove('shake');
				const loadingIcon = document.createElement('span');
				loadingIcon.classList.add('spinner');
				reconnectButton.appendChild(loadingIcon);

				ipcRenderer.send('retry-login');
			});
		} else {
			btn.textContent = 'Reconnect to Discord RPC';
			btn.style.display = "block";
			btn.classList.add('shake');
			btn.innerHTML = '';
		}
	},
	hide: () => {
		const btn = document.getElementById('reconnectButton');
		if (!btn) return;

		btn.style.display = "none";
		btn.innerHTML = '';
	}
});