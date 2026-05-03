const connection = require("./connection");

module.exports = (io) => {
	connection(io);
};
