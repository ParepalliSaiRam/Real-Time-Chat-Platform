import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
import { uploadSingle } from "../middleware/upload.middleware.js";
import {
    createGroupSchema,
    renameGroupSchema,
    updateDescriptionSchema,
    addMembersSchema,
    adminActionSchema,
    updateGroupSettingsSchema
} from "../validations/group.validation.js";
import {
    createGroupController,
    renameGroupController,
    updateDescriptionController,
    updateGroupAvatarController,
    addMembersController,
    removeMemberController,
    leaveGroupController,
    promoteAdminController,
    demoteAdminController,
    updateGroupSettingsController,
    generateInviteController,
    revokeInviteController,
    getInviteController,
    joinGroupController
} from "../controllers/group.controller.js";

const router = Router();

router.post(
    "/",
    authMiddleware,
    validate(createGroupSchema),
    createGroupController
);

router.post(
    "/join/:code",
    authMiddleware,
    joinGroupController
);

router.patch(
    "/:id",
    authMiddleware,
    validate(renameGroupSchema),
    renameGroupController
);

router.patch(
    "/:id/description",
    authMiddleware,
    validate(updateDescriptionSchema),
    updateDescriptionController
);

router.patch(
    "/:id/settings",
    authMiddleware,
    validate(updateGroupSettingsSchema),
    updateGroupSettingsController
);

router.post(
    "/:id/avatar",
    authMiddleware,
    uploadSingle,
    updateGroupAvatarController
);

router.post(
    "/:id/members",
    authMiddleware,
    validate(addMembersSchema),
    addMembersController
);

router.delete(
    "/:id/members/:userId",
    authMiddleware,
    removeMemberController
);

router.post(
    "/:id/leave",
    authMiddleware,
    leaveGroupController
);

router.patch(
    "/:id/admin/promote",
    authMiddleware,
    validate(adminActionSchema),
    promoteAdminController
);

router.patch(
    "/:id/admin/demote",
    authMiddleware,
    validate(adminActionSchema),
    demoteAdminController
);

router.get(
    "/:id/invite",
    authMiddleware,
    getInviteController
);

router.post(
    "/:id/invite",
    authMiddleware,
    generateInviteController
);

router.delete(
    "/:id/invite",
    authMiddleware,
    revokeInviteController
);

export default router;
