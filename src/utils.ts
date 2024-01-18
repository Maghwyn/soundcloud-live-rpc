export const truncate = (str: string, maxLen: number) => {
	if (str.length <= maxLen) {
		return str;
	} else {
		return str.slice(0, maxLen - 3) + '...';
	}
};
