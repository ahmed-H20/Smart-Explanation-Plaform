const express = require("express");
const { protect, allowedTo } = require("../controllers/authController");
const {
	getLoggedUserWallet,
	getLoggedUserBalance,
	getLoggedUserFreezedBalance,
	lockWallet,
	unLockWallet,
	chargeWalletManually,
} = require("../controllers/walletController");

const router = express.Router();

router.use(protect());

router
	// me (logged user) Routes
	.get("/me", allowedTo("student", "instructor", "admin"), getLoggedUserWallet)
	.get("/me/balance", allowedTo("student", "instructor"), getLoggedUserBalance)
	.get(
		"/me/freezedBalance",
		allowedTo("student", "instructor"),
		getLoggedUserFreezedBalance,
	);

router
	// user wallet Routes
	.put("/lock/:id", allowedTo("admin"), lockWallet)
	.put("/unlock/:id", allowedTo("admin"), unLockWallet);

router.put("/manualCharge/:id", allowedTo("admin"), chargeWalletManually);

module.exports = router;
