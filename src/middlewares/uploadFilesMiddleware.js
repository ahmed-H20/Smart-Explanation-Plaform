const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const uploadOptions = () => {
	//1- disk storage engine
	const storage = multer.diskStorage({
		destination: (res, req, cb) => {
			cb(null, "upload/students/files");
		}, // function to add distension to cb function, null main no errors (ask chat gpt to understand)
		filename: (req, file, cb) => {
			console.log(req.user);
			const extinction = file.mimetype.split("/")[1];
			const fileName = `file-${req.user.fullName}-${uuidv4()}.${extinction}`;
			cb(null, fileName);
		}, //function on file to change name
	});

	// filter accept only pdf
	const pdfOnly = function (req, file, cb) {
		if (file.mimetype === "application/pdf") {
			cb(null, true);
		} else {
			cb(new Error("يسمح برفع ملفات PDF فقط"), false);
		}
	};

	// 2- memory storage engine
	// const storage = multer.memoryStorage();
	return multer({
		storage: storage,
		fileFilter: pdfOnly,
		limits: {
			fileSize: 15 * 1024 * 1024, // 15MB
		},
	});
};

const uploadMixOfFiles = (arrayOfFields) =>
	uploadOptions().fields(arrayOfFields);

module.exports = {
	uploadMixOfFiles,
};
