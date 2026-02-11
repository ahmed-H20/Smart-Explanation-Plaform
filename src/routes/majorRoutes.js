const express = require("express");
const {
	createMajor,
	getAllMajor,
	getMajorById,
	updateMajor,
	deleteMajor,
} = require("../controllers/majorsController");
const instructorModel = require("../models/instructorsModel");
const { protect, allowedTo } = require("../controllers/authController");
// const {
// 	createFieldValidator,
// 	updateFieldValidator,
// 	fieldIdValidator,
// } = require("../utils/validators/fieldsValidator");

const router = express.Router();

router.use(protect(instructorModel));

router.route("/").post(allowedTo("admin"), createMajor).get(getAllMajor);
router
	.route("/:id")
	.get(getMajorById)
	.patch(allowedTo("admin"), updateMajor)
	.delete(allowedTo("admin"), deleteMajor);

module.exports = router;
