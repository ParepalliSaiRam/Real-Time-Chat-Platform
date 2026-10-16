import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import {
  deletePushSubscription,
  getPushPublicKey,
  savePushSubscription,
} from "../services/push.service.js";

export const getPublicKeyController = (req, res) => {
  res.json({ success: true, publicKey: getPushPublicKey() });
};

export const saveSubscriptionController = asyncHandler(async (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (
    typeof endpoint !== "string" ||
    typeof keys?.p256dh !== "string" ||
    typeof keys?.auth !== "string"
  ) {
    throw new AppError("A valid push subscription is required.", 400);
  }

  await savePushSubscription(req.user.id, { endpoint, keys });
  res.status(201).json({ success: true });
});

export const deleteSubscriptionController = asyncHandler(async (req, res) => {
  const { endpoint } = req.body || {};
  if (typeof endpoint !== "string") {
    throw new AppError("A subscription endpoint is required.", 400);
  }

  await deletePushSubscription(req.user.id, endpoint);
  res.json({ success: true });
});
