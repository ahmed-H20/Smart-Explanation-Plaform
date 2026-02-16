const express = require("express");
const {
	createMajor,
	getAllMajor,
	getMajorById,
	updateMajor,
	deleteMajor,
	fieldIdFromNestedRoute,
	filterObject,
} = require("../controllers/majorsController");
const instructorModel = require("../models/instructorsModel");
const { protect, allowedTo } = require("../controllers/authController");
const {
	createMajorValidator,
	updateMajorValidator,
	getMajorIdValidator,
} = require("../utils/validators/majorValidator");

const router = express.Router({ mergeParams: true }); //to make nested routing

router.use(protect());

router
	.route("/")
	.post(
		allowedTo("admin"),
		fieldIdFromNestedRoute,
		createMajorValidator,
		createMajor,
	)
	.get(filterObject, getAllMajor);
router
	.route("/:id")
	.get(getMajorIdValidator, getMajorById)
	.patch(allowedTo("admin"), updateMajorValidator, updateMajor)
	.delete(allowedTo("admin"), getMajorIdValidator, deleteMajor);

module.exports = router;
