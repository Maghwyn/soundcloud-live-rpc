import * as dotenv from 'dotenv';
dotenv.config();

// \n compatible
import { EOL } from 'os';

const envsToCheck = ['CLIENT_ID', 'SOUNDCLOUD_START_URL'];

const missing = [];
for (const checked of envsToCheck) {
	if (!process.env[checked]) missing.push(`undefined process.env.${checked}`);
}

if (missing.length > 0) {
	throw new Error(`${EOL}${missing.join(EOL)}${EOL}Trace:`);
}

export const config = {
	clientId: process.env.CLIENT_ID,
	startUrl: process.env.SOUNDCLOUD_START_URL,
};
