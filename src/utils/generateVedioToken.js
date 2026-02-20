const Mux = require("@mux/mux-node");

const mux = new Mux();

async function createMuxPlaybackTokens(playbackId) {
	// Set some base options we can use for a few different signing types
	// Type can be either video, thumbnail, gif, or storyboard
	const baseOptions = {
		keyId: process.env.MUX_SIGNED_KEY_ID, // Enter your signing key id here
		keySecret: process.env.MUX_SIGNED_KEY_ID_SECURE, // Enter your base64 encoded private key here
		expiration: "7d", // E.g 60, "2 days", "10h", "7d", numeric value interpreted as seconds
	};

	const token = await mux.jwt.signPlaybackId(playbackId, {
		...baseOptions,
		type: "video",
	});
	// console.log("video token", token);

	// Now the signed playback url should look like this:
	// https://stream.mux.com/${playbackId}.m3u8?token=${token}

	// If you wanted to pass in params for something like a gif, use the
	// params key in the options object
	// const gifToken = await mux.jwt.signPlaybackId(playbackId, {
	// 	...baseOptions,
	// 	type: "gif",
	// 	params: { time: "10" },
	// });
	// console.log("gif token", gifToken);

	// Then, use this token in a URL like this:
	// https://image.mux.com/${playbackId}/animated.gif?token=${gifToken}

	// A final example, if you wanted to sign a thumbnail url with a playback restriction
	const thumbnailToken = await mux.jwt.signPlaybackId(playbackId, {
		...baseOptions,
		type: "thumbnail",
		// params: { playback_restriction_id: YOUR_PLAYBACK_RESTRICTION_ID },
	});
	// console.log("thumbnail token", thumbnailToken);

	// When used in a URL, it should look like this:
	// https://image.mux.com/${playbackId}/thumbnail.png?token=${thumbnailToken}

	return {
		videoUrl: `https:stream.mux.com/${playbackId}.m3u8?token=${token}`,
		thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.png?token=${thumbnailToken}`,
	};
}

module.exports = {
	createMuxPlaybackTokens,
};
