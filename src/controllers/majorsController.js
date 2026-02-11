const {
	createDocument,
	getAllDocuments,
	getDocument,
	updateDocument,
	deleteDocument,
} = require("./handlerFactory");
const Model = require("../models/majorModel");

// @desc create new Major
// @route POST /api/v1/major
// @access private
const createMajor = createDocument(Model, Model.modelName);

// @desc get all major
// @route GET /api/v1/major
// @access public
const getAllMajor = getAllDocuments(Model, Model.modelName);

// @desc get one Major
// @route GET /api/v1/major/:id
// @access public
const getMajorById = getDocument(Model, Model.modelName);

// @desc update one Major
// @route PATCH /api/v1/major/:id
// @access private
const updateMajor = updateDocument(Model, Model.modelName);

// @desc delete one Major
// @route DELETE /api/v1/major/:id
// @access private
const deleteMajor = deleteDocument(Model, Model.modelName);

module.exports = {
	createMajor,
	getAllMajor,
	getMajorById,
	updateMajor,
	deleteMajor,
};
