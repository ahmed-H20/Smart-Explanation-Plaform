const {
	createDocument,
	getAllDocuments,
	getDocument,
	updateDocument,
	deleteDocument,
} = require("./handlerFactory");
const Model = require("../models/fieldModel");

const documentName = "field";

// @desc create new Field
// @route POST /api/v1/fields
// @access private
const createField = createDocument(Model, documentName);

// @desc get all fields
// @route GET /api/v1/fields
// @access public
const getAllField = getAllDocuments(Model, documentName);

// @desc get one Field
// @route GET /api/v1/fields/:id
// @access public
const getFieldById = getDocument(Model, documentName);

// @desc update one Field
// @route PATCH /api/v1/fields/:id
// @access private
const updateField = updateDocument(Model, documentName);

// @desc delete one Field
// @route DELETE /api/v1/fields/:id
// @access private
const deleteField = deleteDocument(Model, documentName);

module.exports = {
	createField,
	getAllField,
	getFieldById,
	updateField,
	deleteField,
};
