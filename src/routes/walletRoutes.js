const express = require("express");

const { protect, allowedTo } = require("../controllers/authController");
const {
	uploadReceiptFile,
	receiptLocalUpdate,
} = require("../middlewares/receiptUpload");
const {
	// User
	getLoggedUserWallet,
	getLoggedUserBalance,
	getLoggedUserFreezedBalance, //DONE
	getLoggedUserTransactions, //DONE
	// Instructor
	requestWithdraw,
	// Admin — withdrawals
	approveWithdraw,
	rejectWithdraw,
	uploadWithdrawReceipt,
	// Admin — wallet management
	lockWallet, //DONE
	unLockWallet,
	chargeWalletManually,
	getAllWithdrawalRequests,
} = require("../controllers/walletController");

const router = express.Router();

router.use(protect());

router
	// ── Logged-in user ───────────────────────
	.get("/me", allowedTo("student", "instructor", "admin"), getLoggedUserWallet)
	.get("/me/balance", allowedTo("student", "instructor"), getLoggedUserBalance)
	.get(
		"/me/freezedBalance",
		allowedTo("student", "instructor"),
		getLoggedUserFreezedBalance,
	)
	.get(
		"/me/transactions",
		allowedTo("student", "instructor"),
		getLoggedUserTransactions,
	)
	.get("/withdrawalRequests", allowedTo("admin"), getAllWithdrawalRequests);

router
	// ── Instructor — withdraw ────────────────
	.post("/withdraw", allowedTo("instructor"), requestWithdraw);

router
	// ── Admin — withdraw management ──────────
	.patch(
		"/withdraw/:transactionID/approve",
		allowedTo("admin"),
		approveWithdraw,
	)
	.patch("/withdraw/:transactionID/reject", allowedTo("admin"), rejectWithdraw)
	.patch(
		"/withdraw/:transactionID/receipt",
		allowedTo("admin"),
		uploadReceiptFile,
		receiptLocalUpdate,
		uploadWithdrawReceipt,
	);

router
	// ── Admin — wallet management ────────────
	.put("/lock", allowedTo("admin"), lockWallet)
	.put("/unlock", allowedTo("admin"), unLockWallet)
	.put("/manualCharge", allowedTo("admin"), chargeWalletManually);

module.exports = router;
