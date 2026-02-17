const express = require("express");
const {
	createField,
	getAllField,
	getFieldById,
	updateField,
	deleteField,
} = require("../controllers/fieldsController");
const instructorModel = require("../models/instructorsModel");
const { protect, allowedTo } = require("../controllers/authController");
const {
	createFieldValidator,
	updateFieldValidator,
	fieldIdValidator,
} = require("../utils/validators/fieldsValidator");
const MajorsRoutes = require("./majorRoutes");

const router = express.Router();

router.use(protect());

router.use("/:fieldId/majors", MajorsRoutes);

router
	.route("/")
	.post(allowedTo("admin"), createFieldValidator, createField)
	.get(getAllField);
router
	.route("/:id")
	.get(fieldIdValidator, getFieldById)
	.patch(allowedTo("admin"), updateFieldValidator, updateField)
	.delete(allowedTo("admin"), fieldIdValidator, deleteField);

module.exports = router;
