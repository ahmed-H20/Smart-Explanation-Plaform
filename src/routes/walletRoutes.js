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
	);

router
	// ── Instructor — withdraw ────────────────
	.post("/withdraw", allowedTo("instructor"), requestWithdraw);

router
	// ── Admin — withdraw management ──────────
	.patch("/withdraw/:id/approve", allowedTo("admin"), approveWithdraw)
	.patch("/withdraw/:id/reject", allowedTo("admin"), rejectWithdraw)
	.patch(
		"/withdraw/:id/receipt",
		allowedTo("admin"),
		uploadReceiptFile,
		receiptLocalUpdate,
		uploadWithdrawReceipt,
	);

router
	// ── Admin — wallet management ────────────
	.put("/lock/:id", allowedTo("admin"), lockWallet)
	.put("/unlock/:id", allowedTo("admin"), unLockWallet)
	.put("/manualCharge/:id", allowedTo("admin"), chargeWalletManually);

module.exports = router;
