const {
	createDocument,
	getAllDocuments,
	getDocument,
	updateDocument,
	deleteDocument,
} = require("./handlerFactory");
const Model = require("../models/countryModel");

const documentName = "country";

// @desc create new Country
// @route POST /api/v1/countries
// @access private
const createCountry = createDocument(Model, documentName);

// @desc get all Countries
// @route GET /api/v1/countries
// @access public
const getAllCountry = getAllDocuments(Model, documentName);

// @desc get one Country
// @route GET /api/v1/countries/:id
// @access public
const getCountryById = getDocument(Model, documentName);

// @desc update one Country
// @route PATCH /api/v1/countries/:id
// @access private
const updateCountry = updateDocument(Model, documentName);

// @desc delete one Country
// @route DELETE /api/v1/countries/:id
// @access private
const deleteCountry = deleteDocument(Model, documentName);

module.exports = {
	createCountry,
	getAllCountry,
	getCountryById,
	updateCountry,
	deleteCountry,
};
