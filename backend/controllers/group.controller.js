import * as groupService from '../services/group.service.js';
import { isDBConnected } from '../config/database.js';

function checkDB(res) {
    if (!isDBConnected()) {
        res.status(503).json({
            error: 'Database not available. Please configure MongoDB connection.'
        });
        return false;
    }
    return true;
}

/**
 * Create a new group
 */
export async function createGroup(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const userId = req.userId;
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Group name is required' });
        }

        const group = await groupService.createGroup({
            name: name.trim(),
            createdBy: userId
        });

        res.status(201).json(group);
    } catch (error) {
        console.error('createGroup error:', error);
        next(error);
    }
}

/**
 * Get all groups for the authenticated user
 */
export async function getUserGroups(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const userId = req.userId;
        const groups = await groupService.getUserGroups(userId);

        res.json(groups);
    } catch (error) {
        console.error('getUserGroups error:', error);
        next(error);
    }
}

/**
 * Get group by ID
 */
export async function getGroupById(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const { groupId } = req.params;
        const group = await groupService.getGroupById(groupId);

        res.json(group);
    } catch (error) {
        console.error('getGroupById error:', error);
        if (error.message === 'Group not found') {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
}

/**
 * Add member to group by email
 */
export async function addMemberByEmail(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const userId = req.userId;
        const { groupId } = req.params;
        const { email } = req.body;

        if (!email || email.trim() === '') {
            return res.status(400).json({ error: 'Email is required' });
        }

        const result = await groupService.addMemberByEmail({
            groupId,
            email: email.trim(),
            requestingUserId: userId
        });

        res.json(result);
    } catch (error) {
        console.error('addMemberByEmail error:', error);
        if (error.message === 'Group not found' || error.message === 'User not found with this email') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Only group admin can add members' ||
            error.message === 'User is already a member of this group') {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
}

/**
 * Remove member from group
 */
export async function removeMember(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const userId = req.userId;
        const { groupId, memberId } = req.params;

        const group = await groupService.removeMember({
            groupId,
            memberUserId: memberId,
            requestingUserId: userId
        });

        res.json(group);
    } catch (error) {
        console.error('removeMember error:', error);
        if (error.message === 'Group not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Only group admin can remove members' ||
            error.message === 'Cannot remove group admin') {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
}

/**
 * Get group members with details
 */
export async function getGroupMembers(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const { groupId } = req.params;
        const members = await groupService.getGroupMembers(groupId);

        res.json(members);
    } catch (error) {
        console.error('getGroupMembers error:', error);
        if (error.message === 'Group not found') {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
}

/**
 * Delete a group
 */
export async function deleteGroup(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const userId = req.userId;
        const { groupId } = req.params;

        const result = await groupService.deleteGroup({
            groupId,
            requestingUserId: userId
        });

        res.json(result);
    } catch (error) {
        console.error('deleteGroup error:', error);
        if (error.message === 'Group not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Only group admin can delete the group') {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
}

/**
 * Update group name
 */
export async function updateGroupName(req, res, next) {
    try {
        if (!checkDB(res)) return;

        const userId = req.userId;
        const { groupId } = req.params;
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Group name is required' });
        }

        const group = await groupService.updateGroupName({
            groupId,
            name: name.trim(),
            requestingUserId: userId
        });

        res.json(group);
    } catch (error) {
        console.error('updateGroupName error:', error);
        if (error.message === 'Group not found') {
            return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Only group admin can update group name') {
            return res.status(403).json({ error: error.message });
        }
        next(error);
    }
}
