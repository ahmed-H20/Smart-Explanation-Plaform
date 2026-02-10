const asyncHandler = require("express-async-handler");

const ApiError = require("../utils/ApiError");
const ApiFeatures = require("../utils/ApiFeatures");

const deleteDocument = (Model, documentName) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await Model.findByIdAndDelete(id);
    if (!document) {
      return next(
        new ApiError(`cannot find ${documentName} for this id : ${id}`, 404),
      );
    }
    res.status(200).json({
      message: `${documentName} with id ${id} is Deleted`,
    });
  });

const updateDocument = (Model, documentName) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    // User exception: not update user password
    if (documentName === "user") {
      const { password, ...body } = req.body;
      req.body = body;
    }

    const document = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!document) {
      return next(
        new ApiError(`cannot find ${documentName} for this id : ${id}`, 404),
      );
    }
    res.status(200).json({
      message: `${documentName} is Updated`,
      data: document,
    });
  });

const createDocument = (Model, documentName) =>
  asyncHandler(async (req, res, next) => {
    const document = await Model.create(req.body);
    res.status(200).json({
      message: `${documentName} is created`,
      data: document,
    });
  });

const getDocument = (Model, documentName) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await Model.findById(id);
    if (!document) {
      return next(
        new ApiError(`cannot find ${documentName} with id : ${id}`, 404),
      );
    }
    res.status(200).json({ data: document });
  });

const getAllDocuments = (Model, name = "") =>
  asyncHandler(async (req, res, next) => {
    let filter = {};
    if (req.findObject) {
      filter = req.findObject;
    }
    const documentsCount = await Model.countDocuments();
    // Query build
    const productsData = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .search(name)
      .build()
      .pagination(documentsCount)
      .limitation()
      .sort()
      .populated("category", "name");

    const { mongooseQuery, pagination } = productsData;

    const document = await mongooseQuery;
    res.status(200).json({
      paginationResults: pagination,
      results: document.length,
      data: document,
    });
  });

module.exports = {
  deleteDocument,
  updateDocument,
  createDocument,
  getDocument,
  getAllDocuments,
};
