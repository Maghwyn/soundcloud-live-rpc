import { contextBridge, ipcRenderer } from 'electron/renderer';

contextBridge.exposeInMainWorld('electronAPI', {
	onClearPresence: () => ipcRenderer.send('clear-presence'),
	onPlayerActive: () => ipcRenderer.send('player-active'),
	onTrackDrag: () => {
		const playbackTimeline: HTMLDivElement = document.querySelector('div.playbackTimeline');

		if (playbackTimeline) {
			const dragDropped = !playbackTimeline.classList.contains('is-dragging');

			if (dragDropped) {
				const progressWrapperElement: HTMLDivElement = document.querySelector('.playbackTimeline__progressWrapper');

				if (progressWrapperElement) {
					const time = progressWrapperElement.getAttribute('aria-valuenow');
					const duration = progressWrapperElement.getAttribute('aria-valuemax');
					ipcRenderer.send('set-track-time', time, duration);
				}
			}
		}
	},
	setPlayer: () => {
		const playerElement: HTMLButtonElement = document.querySelector('.playControls__play');

		if (playerElement) {
			const isPlaying = playerElement.classList.contains('playing');
			ipcRenderer.send('set-player', isPlaying);

			if (isPlaying) {
				const progressWrapperElement: HTMLDivElement = document.querySelector('.playbackTimeline__progressWrapper');

				if (progressWrapperElement) {
					const time = progressWrapperElement.getAttribute('aria-valuenow');
					const duration = progressWrapperElement.getAttribute('aria-valuemax');
					ipcRenderer.send('set-track-time', time, duration);
				}
			}
		}
	},
	setTrackData: () => {
		const authorElement: HTMLAnchorElement = document.querySelector('.playbackSoundBadge__lightLink');
		const titleElement: HTMLAnchorElement = document.querySelector('.playbackSoundBadge__titleLink');
		const spanElement: HTMLSpanElement = document.querySelector('.playbackSoundBadge__avatar .image__lightOutline span');

		if (authorElement && titleElement && spanElement) {
			const titleSpanElement: HTMLSpanElement = titleElement.querySelector('span:nth-child(2)');

			const author = authorElement.textContent;
			const title = titleSpanElement.innerText;
			const url = titleElement.href;
			const imageUrl = spanElement.style.backgroundImage;
			ipcRenderer.send('set-track-image', author, title, url, imageUrl);
		}
	},
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

			const spinner = btn.querySelector("span");
			if (spinner !== null) {
				btn.removeChild(spinner);
			}
		}
	},
	hide: () => {
		const btn = document.getElementById('reconnectButton');
		if (!btn) return;

		btn.style.display = "none";

		const spinner = btn.querySelector("span");
		if (spinner !== null) {
			btn.removeChild(spinner);
		}
	}
});