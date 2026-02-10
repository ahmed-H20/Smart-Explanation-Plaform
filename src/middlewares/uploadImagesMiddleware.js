const multer = require("multer");

const uploadOptions = () => {
	// 1- disk storage engine
	// const storage = multer.diskStorage({
	// 	destination: (res, req, cb) => {
	// 		cb(null, "upload/category");
	// 	}, // function to add distension to cb function, null main no errors (ask chat gpt to understand)
	// 	filename: (req, file, cb) => {
	// 		const extintion = file.mimetype.split("/")[1];
	// 		const fileName = `category-${uuidv4()}.${extintion}`;
	// 		cb(null, fileName);
	// 	}, //function on file to change name
	// });

	// filter accept only images
	const imageOnly = function (req, file, cb) {
		if (file.mimetype.split("/")[0] === "image") {
			cb(null, true);
		} else {
			cb(new Error("Image files only accept"), false);
		}
	};

	// 2- memory storage engine
	const storage = multer.memoryStorage(); // not take any thing like disk storage, just return object of data
	return multer({ storage: storage, fileFilter: imageOnly });
};

const uploadSingleImage =
	(fieldName = "image") =>
	(req, res, next) => {
		const upload = uploadOptions().single(fieldName);
		upload(req, res, (err) => {
			if (err) {
				return res.status(400).json({ error: err.message });
			}
			next();
		});
	};

const uploadMixOfImages = (arrayOfFields) =>
	uploadOptions().fields(arrayOfFields);

module.exports = {
	uploadSingleImage,
	uploadMixOfImages,
};
