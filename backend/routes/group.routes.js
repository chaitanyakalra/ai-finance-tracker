import express from 'express';
import * as groupController from '../controllers/group.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All group routes require JWT authentication
router.post('/', authenticateToken, groupController.createGroup);
router.get('/', authenticateToken, groupController.getUserGroups);
router.get('/:groupId', authenticateToken, groupController.getGroupById);
router.get('/:groupId/members', authenticateToken, groupController.getGroupMembers);
router.post('/:groupId/members', authenticateToken, groupController.addMemberByEmail);
router.delete('/:groupId/members/:memberId', authenticateToken, groupController.removeMember);
router.put('/:groupId/name', authenticateToken, groupController.updateGroupName);
router.delete('/:groupId', authenticateToken, groupController.deleteGroup);

export default router;
