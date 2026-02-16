const express = require("express");
const { protect, allowedTo } = require("../controllers/authController");
const {
	createTransaction,
	getOneTransactionById,
	getAllTransaction,
	getAllUserTransactions,
} = require("../controllers/transactionController");

const router = express.Router();

router.use(protect());

router
	.post("/", allowedTo("admin"), createTransaction)
	.get("/", allowedTo("admin"), getAllTransaction);

router.get("/user/:userId", allowedTo("admin"), getAllUserTransactions);

router.get("/:id", allowedTo("admin"), getOneTransactionById);

module.exports = router;
