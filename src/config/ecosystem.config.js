module.exports = {
	apps: [
		{
			name: "api",
			script: "server.js",
			instances: 1,
			autorestart: true,
			watch: false,
			env: {
				NODE_ENV: "production",
			},
		},
		{
			name: "email-worker",
			script: "src/queues/email/emailWorkers.js",
			instances: 1,
			autorestart: true,
			watch: false,
			env: {
				NODE_ENV: "production",
			},
		},
	],
};
