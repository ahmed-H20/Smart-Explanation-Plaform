const mongoose = require("mongoose");

const formatPrice = require("../utils/formatePrice");

function isUSDField(key) {
	return key.endsWith("USD");
}

async function transformObject(obj, user) {
	if (!obj || typeof obj !== "object") return obj;

	// array
	if (Array.isArray(obj)) {
		return Promise.all(obj.map((item) => transformObject(item, user)));
	}

	const entries = await Promise.all(
		Object.entries(obj).map(async ([key, value]) => {
			// USD field
			if (isUSDField(key) && typeof value === "number") {
				const formatted = await formatPrice(value, user);
				const newKey = key.replace("USD", "");
				return [newKey, formatted];
			}

			// nested object
			if (typeof value === "object" && value !== null) {
				const transformedValue = await transformObject(value, user);
				return [key, transformedValue];
			}

			return [key, value];
		}),
	);

	return entries.reduce((acc, [key, value]) => {
		acc[key] = value;
		return acc;
	}, {});
}

function normalizeData(obj) {
	if (!obj || typeof obj !== "object") return obj;

	// 🟢 ObjectId
	if (obj instanceof mongoose.Types.ObjectId) {
		return obj.toString();
	}

	// 🟢 Date
	if (obj instanceof Date) {
		return obj.toISOString();
	}

	// 🟢 Array
	if (Array.isArray(obj)) {
		return obj.map(normalizeData);
	}

	// 🟢 Mongoose Document
	if (typeof obj.toObject === "function") {
		return normalizeData(obj.toObject());
	}

	// 🟢 Normal Object
	const normalized = {};

	Object.entries(obj).forEach(([key, value]) => {
		normalized[key] = normalizeData(value);
	});

	return normalized;
}

module.exports = function responseFormatter(req, res, next) {
	const oldJson = res.json;

	res.json = async function (data) {
		data = normalizeData(data);
		if (req.user) {
			data = await transformObject(data, req.user);
		}

		return oldJson.call(this, data);
	};

	next();
};
