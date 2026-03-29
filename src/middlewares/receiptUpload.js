const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const uploadReceiptOptions = () => {
	const storage = multer.diskStorage({
		destination: (req, res, cb) => {
			cb(null, "upload/receipts");
		},
		filename: (req, file, cb) => {
			const extinction = file.mimetype.split("/")[1];
			const fileName = `receipt-${uuidv4()}.${extinction}`;
			cb(null, fileName);
		},
	});

	const pdfAndImages = (req, file, cb) => {
		const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
		if (allowed.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("يسمح برفع ملفات PDF أو صور فقط"), false);
		}
	};

	return multer({
		storage,
		fileFilter: pdfAndImages,
		limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
	});
};

const uploadReceiptFile = uploadReceiptOptions().single("receipt");

const receiptLocalUpdate = (req, res, next) => {
	if (req.file) {
		req.receiptUrl = req.file.filename;
	}
	next();
};

module.exports = { uploadReceiptFile, receiptLocalUpdate };
