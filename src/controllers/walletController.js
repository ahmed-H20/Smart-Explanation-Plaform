const asyncHandler = require("express-async-handler");

const Wallet = require("../models/walletModel");
const ApiError = require("../utils/ApiError");

// @desc get logged user wallet
// @route GET /wallet/me
// @access private user
const getLoggedUserWallet = asyncHandler(async (req, res, next) => {
	// 1- get wallet from user id
	const wallet = await Wallet.findOne({ userId: req.user._id });
	if (!wallet) {
		return next(new ApiError("This user not have a wallet!", 504));
	}

	// 2- send res
	res.status(200).json({
		status: "success",
		data: wallet,
	});
});

// TODO:get platform wallet

// @desc get logged user balance
// @route GET /wallet/balance
// @access private user
const getLoggedUserBalance = asyncHandler(async (req, res, next) => {
	// 1- get wallet from user id
	const wallet = await Wallet.findOne({ userId: req.user._id });
	if (!wallet) {
		return next(new ApiError("This user not have a wallet!", 504));
	}

	// 2- send res
	res.status(200).json({
		status: "success",
		data: wallet.balance,
	});
});

// @desc get logged user freezed-balance
// @route GET /wallet/me/freezedBalance
// @access private user
const getLoggedUserFreezedBalance = asyncHandler(async (req, res, next) => {
	// 1- get wallet from user id
	const wallet = await Wallet.findOne({ userId: req.user._id });
	if (!wallet) {
		return next(new ApiError("This user not have a wallet!", 504));
	}

	// 2- send res
	res.status(200).json({
		status: "success",
		data: wallet.freezedBalance,
	});
});

// TODO: @desc get logged user transactions
// @route GET /wallet/me/transactions
// @access private user

// @desc look wallet for user
// @route PUT /wallet/lock/:id
// @access private (admin)
const lockWallet = asyncHandler(async (req, res, next) => {
	// 1- get user id
	const { id } = req.params;

	// 2- get wallet
	const wallet = await Wallet.findOne({ userId: id });
	if (!wallet) {
		return next(new ApiError("This user not have a wallet!", 504));
	}

	// 3- lock wallet
	wallet.isLocked = true;
	await wallet.save();

	// 4- res
	res.status(200).json({
		status: "success",
		message: `wallet for user: ${id} is locked🔒`,
	});
});

// @desc unLook wallet for user
// @route PUT /wallet/unlock/:id
// @access private (admin)
const unLockWallet = asyncHandler(async (req, res, next) => {
	// 1- get user id
	const { id } = req.params;

	// 2- get wallet
	const wallet = await Wallet.findOne({ userId: id });
	if (!wallet) {
		return next(new ApiError("This user not have a wallet!", 504));
	}

	// 3- lock wallet
	wallet.isLocked = false;
	await wallet.save();

	// 4- res
	res.status(200).json({
		status: "success",
		message: `wallet for user: ${id} is unlocked🔓`,
	});
});

module.exports = {
	getLoggedUserWallet,
	getLoggedUserBalance,
	getLoggedUserFreezedBalance,
	lockWallet,
	unLockWallet,
};

/*
POST  /wallet/deposit
POST  /wallet/withdraw
*/

// NOTE: TO Link with getway payment
// TODO: first step
// const checkoutSession = asyncHandler(async (req, res, next) => {
// 	//params -> cartId
// 	const { cartId } = req.params;

// 	const taxPrice = 0;
// 	const shippingPrice = 0;

// 	// 1- get cart depends on cartId
// 	const cart = await Cart.findById(cartId).populate(
// 		"items.product",
// 		"title coverImage",
// 	);
// 	if (!cart) next(new ApiError("There is no cart for this user", 404));

// 	// 2- get total order price from cart (check if coupon apply)
// 	const totalOrderPrice =
// 		cart.totalPriceAfterDiscount > 0
// 			? cart.totalPriceAfterDiscount
// 			: cart.totalPrice;

// 	const totalPrice = totalOrderPrice + taxPrice + shippingPrice;

// 	// get cart items to send to stripe - each product data
// 	const lineItems = cart.items.map((item) => ({
// 		price_data: {
// 			currency: "egp",
// 			unit_amount: Math.round(item.price * 100),
// 			product_data: {
// 				name: item.product.title,
// 				images: [item.product.coverImage],
// 			},
// 		},
// 		quantity: item.quantity,
// 	}));

// 	// 3- create stripe checkout session
// 	const session = await stripe.checkout.sessions.create({
// 		line_items: lineItems,
// 		// for all data if you want fast code
// 		//[
// 		// 	{
// 		// 		price_data: {
// 		// 			currency: "egp",
// 		// 			unit_amount_decimal: totalPrice * 100,
// 		// 			product_data: {
// 		// 				name: "Order Payment",
// 		// 			},
// 		// 		},
// 		// 		quantity: 1,
// 		// 	},
// 		// ],
// 		// eslint-disable-next-line no-undef
// 		success_url: `${req.protocol}://${req.get("host")}/success`,
// 		cancel_url: `${req.protocol}://${req.get("host")}/failed`,
// 		mode: "payment",
// 		customer_email: req.user.email,
// 		client_reference_id: cartId,
// 	});

// 	// 4- send session to response
// 	res.status(200).json({
// 		status: "success",
// 		session,
// 	});
// });

// TODO: Second step
// const webhookCheckout = asyncHandler(async (req, res, next) => {
// 	let event;
// 	// Get the signature sent by Stripe
// 	const signature = req.headers["stripe-signature"];
// 	const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// 	if (endpointSecret) {
// 		try {
// 			event = await stripe.webhooks.constructEvent(
// 				req.body,
// 				signature,
// 				endpointSecret,
// 			);
// 		} catch (err) {
// 			console.log(`⚠️ Webhook signature verification failed.`, err.message);
// 			return res.sendStatus(400);
// 		}

// 		if (event.type === "checkout.session.completed") {
// 			const order = await createCardOrder(event.data.object);
// 			if (order) {
// 				console.log(order);
// 				res.status(200).json({ paid: true });
// 			}
// 		}

// 		res.status(500).json({ message: "failed to pay" });
// 	}
// });

// TODO: third step
// create order after card payment success
