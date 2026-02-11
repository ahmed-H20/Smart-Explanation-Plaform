const { body, param } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const majorModel = require("../../models/majorModel");
const fieldModel = require("../../models/fieldModel");

/* 
==================
	Create Major
=================
*/
const createMajorValidator = [
	body("name")
		.notEmpty()
		.withMessage("اسم التخصص مطلوب")
		.isString()
		.withMessage("اسم التخصص يجب أن يكون نص")
		.isLength({ min: 2 })
		.withMessage("اسم التخصص يجب ألا يقل عن حرفين")
		.custom(async (name) => {
			const major = await majorModel.findOne({ name });
			if (major) {
				throw new Error("هذا التخصص موجود بالفعل");
			}
			return true;
		}),

	body("field")
		.notEmpty()
		.withMessage("المجال الرئيسي مطلوب")
		.isMongoId()
		.withMessage("معرّف المجال غير صحيح")
		.custom(async (fieldId) => {
			const field = await fieldModel.findById(fieldId);
			if (!field) {
				throw new Error("المجال الرئيسي غير موجود");
			}
			return true;
		}),

	validatorMiddleware,
];

/* 
==================
	Update Major
=================
*/
const updateMajorValidator = [
	param("id").isMongoId().withMessage("معرّف التخصص غير صحيح"),

	body("name")
		.optional()
		.isString()
		.withMessage("اسم التخصص يجب أن يكون نص")
		.isLength({ min: 2 })
		.withMessage("اسم التخصص يجب ألا يقل عن حرفين")
		.custom(async (name, { req }) => {
			const major = await majorModel.findOne({ name });
			if (major && major._id.toString() !== req.params.id) {
				throw new Error("هذا التخصص موجود بالفعل");
			}
			return true;
		}),

	body("field")
		.optional()
		.isMongoId()
		.withMessage("معرّف المجال غير صحيح")
		.custom(async (fieldId) => {
			const field = await fieldModel.findById(fieldId);
			if (!field) {
				throw new Error("المجال الرئيسي غير موجود");
			}
			return true;
		}),

	validatorMiddleware,
];

/* 
==================
	Get One/ Delete Major
=================
*/
const getMajorIdValidator = [
	param("id").isMongoId().withMessage("معرّف التخصص غير صحيح"),

	validatorMiddleware,
];

module.exports = {
	createMajorValidator,
	updateMajorValidator,
	getMajorIdValidator,
};
