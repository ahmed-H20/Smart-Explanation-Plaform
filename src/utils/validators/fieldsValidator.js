const { body, param } = require("express-validator");
const fieldModel = require("../../models/fieldModel");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

/* =========================
   CREATE FIELD
========================= */
const createFieldValidator = [
	// name
	body("name")
		.notEmpty()
		.withMessage("برجاء إدخال اسم المجال")
		.isString()
		.withMessage("اسم المجال يجب أن يكون نص")
		.isLength({ min: 3 })
		.withMessage("اسم المجال لا يقل عن 3 أحرف")
		.custom((name) =>
			fieldModel.findOne({ name }).then((field) => {
				if (field) {
					return Promise.reject(new Error("اسم المجال موجود بالفعل"));
				}
				return true;
			}),
		),

	// description
	body("description")
		.optional()
		.isString()
		.withMessage("الوصف يجب أن يكون نص")
		.isLength({ min: 20 })
		.withMessage("الوصف قصير جدًا، يجب ألا يقل عن 20 حرف"),

	// majors
	body("majors")
		.optional()
		.isArray()
		.withMessage("المجالات المرتبطة يجب أن تكون Array"),

	body("majors.*").optional().isMongoId().withMessage("معرّف التخصص غير صحيح"),

	validatorMiddleware,
];

/* =========================
   UPDATE FIELD
========================= */
const updateFieldValidator = [
	param("id").isMongoId().withMessage("معرّف المجال غير صحيح"),

	body("name")
		.optional()
		.isString()
		.withMessage("اسم المجال يجب أن يكون نص")
		.isLength({ min: 3 })
		.withMessage("اسم المجال لا يقل عن 3 أحرف")
		.custom((name, { req }) =>
			fieldModel.findOne({ name }).then((field) => {
				if (field && field._id.toString() !== req.params.id) {
					return Promise.reject(new Error("اسم المجال مستخدم بالفعل"));
				}
				return true;
			}),
		),

	body("description")
		.optional()
		.isString()
		.withMessage("الوصف يجب أن يكون نص")
		.isLength({ min: 20 })
		.withMessage("الوصف قصير جدًا، يجب ألا يقل عن 20 حرف"),

	body("majors").optional().isArray().withMessage("التخصصات يجب أن تكون Array"),

	body("majors.*").optional().isMongoId().withMessage("id التخصص غير صحيح"),

	validatorMiddleware,
];

/* =========================
   ID VALIDATOR (GET / DELETE)
========================= */
const fieldIdValidator = [
	param("id").isMongoId().withMessage("id المجال غير صحيح"),
	validatorMiddleware,
];

module.exports = {
	createFieldValidator,
	updateFieldValidator,
	fieldIdValidator,
};
