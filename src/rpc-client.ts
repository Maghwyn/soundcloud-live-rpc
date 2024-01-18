import { Client, Presence } from 'discord-rpc';

import { config } from './config';
import { truncate } from './utils';

class RPCDiscordClient extends Client {
	private static instance: RPCDiscordClient;
	private isPlaying = false;

	private iconPlay = {
		url: 'https://i.ibb.co/31gPDSC/play.png',
		text: 'Playing',
	};
	private iconPause = {
		url: 'https://i.ibb.co/jv02b4q/pause.png',
		text: 'Paused',
	};
	private presence: Presence = {
		instance: false,
	};

	private constructor() {
		super({ transport: 'ipc' });
		this.login({ clientId: config.clientId }).catch((err) => {
			process.exitCode = 1;
			throw new Error(err);
		});
	}

	public static getInstance(): RPCDiscordClient {
		if (!RPCDiscordClient.instance) {
			RPCDiscordClient.instance = new RPCDiscordClient();
		}
		return RPCDiscordClient.instance;
	}

	public setPresenceStatus(isPlaying: boolean) {
		if (isPlaying) {
			this.presence.smallImageKey = this.iconPlay.url;
			this.presence.smallImageText = this.iconPlay.text;
		} else {
			this.presence.smallImageKey = this.iconPause.url;
			this.presence.smallImageText = this.iconPause.text;
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

	public setPresenceTrackTime(time: number, duration: number) {
		if (!this.isPlaying) return;

		const remaining = (duration - time) * 1000;
		this.presence.endTimestamp = +new Date() + remaining;

		this.updatePresence();
	}

	private updatePresence() {
		this.setActivity(this.presence);
	}
}

export const RPCClient = RPCDiscordClient.getInstance();
