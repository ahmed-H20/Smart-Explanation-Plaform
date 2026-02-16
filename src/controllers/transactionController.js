const asyncHandler = require("express-async-handler");

const Wallet = require("../models/walletModel");
const Transactions = require("../models/transactionsModel");
const ApiError = require("../utils/ApiError");
const {
	createDocument,
	getDocument,
	getAllDocuments,
} = require("./handlerFactory");
const ApiFeatures = require("../utils/ApiFeatures");

//DEBUG(TEST) @desc Create Trans
// @route POST /transitions
// @access private admin
const createTransaction = createDocument(Transactions, Transactions.modelName);

// @desc get one trans by id
// @route GET /transitions/:id
// @access private admin
const getOneTransactionById = getDocument(Transactions, Transactions.modelName);

// @desc get all trans
// @route GET /transitions/
// @access private admin
const getAllTransaction = getAllDocuments(Transactions, Transactions.modelName);

// @desc get all specific user trans
// @route GET /transitions/user/:userId
// @access private admin
const getAllUserTransactions = asyncHandler(async (req, res, next) => {
	const { userId } = req.params;

	// 1- find the user's wallet (Student or Instructor)
	const wallet = await Wallet.findOne({ userId });
	if (!wallet) {
		return next(new ApiError("This user has no wallet", 504));
	}

	let filter = { wallet: wallet._id };
	if (req.findObject) {
		filter = { ...req.findObject, filter };
	}
	// Query build
	const productsData = new ApiFeatures(Transactions.find(filter), req.query)
		.filter()
		.search()
		.build()
		.limitation();

	const { mongooseQuery } = productsData;

	// 2- get all transactions for this wallet, populate user
	const transactions = await mongooseQuery
		.populate({
			path: "wallet",
			populate: {
				path: "userId",
				select: "fullName email role",
			},
		})
		.sort({ createdAt: -1 }); // latest first

	// 3- send response
	res.status(200).json({
		status: "success",
		results: transactions.length,
		data: transactions,
	});
});

module.exports = {
	createTransaction,
	getOneTransactionById,
	getAllTransaction,
	getAllUserTransactions,
};

/*

GET /transactions/platform/revenue
GET /transactions/platform/revenue?from=2026-01-01&to=2026-02-01
*/

// optional
/*
-> should trans be 
    reason = 'platform_profit'
    status = 'completed'

GET /analytics/platform-revenue
GET /analytics/platform-revenue?groupBy=day
GET /analytics/platform-revenue?groupBy=month
GET /analytics/platform-revenue?currency=EGP
GET /analytics/platform-revenue?from=2026-01-01&to=2026-02-01
*/
