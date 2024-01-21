import { Client, Presence } from 'discord-rpc';

import { config } from './config';
import { truncate } from './utils';

const iconPlay = {
	url: 'https://i.ibb.co/31gPDSC/play.png',
	text: 'Playing',
};

const iconPause = {
	url: 'https://i.ibb.co/jv02b4q/pause.png',
	text: 'Paused',
};

class RPCDiscordClient extends Client {
	// Singleton instance of the rpc client
	private static instance: RPCDiscordClient;

	// Prevent the timer from starting when the song is paused and the user drag the pbar
	private isPlaying = false;

	// Cache track time
	private lastTime = 0;

	// Cache track duration
	private lastDuration = 0;

	// Cache rich presence
	private presence: Presence = {
		instance: false,
	};

	private constructor() {
		super({ transport: 'ipc' });
		this.setup();
	}

	public static getInstance(): RPCDiscordClient {
		if (!RPCDiscordClient.instance) {
			RPCDiscordClient.instance = new RPCDiscordClient();
		}
		return RPCDiscordClient.instance;
	}

	public setup() {
		this.login({ clientId: config.clientId }).catch((err: Error) => {
			//! Can be caused by login too many times in a short time

			console.error(err);
			this.emit('timeout', err);
		});
	}

	public setPresenceStatus(isPlaying: boolean) {
		if (isPlaying) {
			this.presence.smallImageKey = iconPlay.url;
			this.presence.smallImageText = iconPlay.text;
		} else {
			this.presence.smallImageKey = iconPause.url;
			this.presence.smallImageText = iconPause.text;
			delete this.presence.endTimestamp;
		}

		this.isPlaying = isPlaying;
		this.updatePresence();
	}

	public setPresenceTrackData(author: string, title: string, url: string, imageUrl: string) {
		const trackTitle = truncate(title.replace(/\n./s, ''), 120);
		const trackAuthor = truncate(author.replace(/\n./s, ''), 120);

		this.presence.state = `by ${trackAuthor}`;
		this.presence.details = trackTitle;
		this.presence.largeImageText = trackTitle;
		this.presence.largeImageKey = imageUrl
			.replace('url("', '')
			.replace('")', '')
			.replace('50x50.', '500x500.');
		this.presence.buttons = [
			{
				label: 'Play on SoundCloud',
				url: url,
			},
		];

		this.updatePresence();
	}

	public setPresenceTrackTime(time: number, duration: number, debounced: boolean) {
		// Prevent updating the time when the player is not running
		if (!this.isPlaying) return;

		// When the song duration change, we update the time cache
		this.updateDurationCacheOnChange(time, duration);

		// When the user drag the waveform, the observe is triggered at each second change.
		// So in order to prevent a tons of rp updates, we debounce it and when we know it's coming from the debounce
		// We're checking if the user did something manually that cause the rupture of the time flow.
		if (debounced && Math.abs(this.lastTime - time) <= 1) {
			this.lastTime = time;
			return;
		} else {
			this.lastTime = time;
		}

		const offsetDebounce = debounced ? 500 : 0;
		const remaining = ((duration - time) * 1000) - offsetDebounce;
		this.presence.endTimestamp = +new Date() + remaining;

		this.updatePresence();
	}

	private updateDurationCacheOnChange(time: number, duration: number) {
		if (this.lastDuration !== duration) {
			this.lastDuration = duration;
			this.lastTime = time;
		}
	}

	private updatePresence() {
		this.setActivity(this.presence);
	}
}

export const RPCClient = RPCDiscordClient.getInstance();
