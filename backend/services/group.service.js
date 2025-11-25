import Group from '../models/Group.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new group
 */
export async function createGroup({ name, createdBy }) {
    const group = new Group({
        id: uuidv4(),
        name,
        createdBy,
        members: [
            {
                userId: createdBy,
                joinedAt: new Date()
            }
        ]
    });

    await group.save();
    return group;
}

/**
 * Get all groups for a user
 */
export async function getUserGroups(userId) {
    const groups = await Group.find({
        'members.userId': userId
    }).sort({ createdAt: -1 });

    return groups;
}

/**
 * Get group by ID
 */
export async function getGroupById(groupId) {
    const group = await Group.findOne({ id: groupId });

    if (!group) {
        throw new Error('Group not found');
    }

    return group;
}

/**
 * Add member to group by email
 */
export async function addMemberByEmail({ groupId, email, requestingUserId }) {
    // Find the group
    const group = await Group.findOne({ id: groupId });

    if (!group) {
        throw new Error('Group not found');
    }

    // Check if requesting user is the group admin
    if (group.createdBy !== requestingUserId) {
        throw new Error('Only group admin can add members');
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        throw new Error('User not found with this email');
    }

    // Check if user is already a member
    const isMember = group.members.some(member => member.userId === user.id);

    if (isMember) {
        throw new Error('User is already a member of this group');
    }

    // Add user to group
    group.members.push({
        userId: user.id,
        joinedAt: new Date()
    });

    await group.save();

    return {
        group,
        addedUser: {
            id: user.id,
            email: user.email,
            name: user.name
        }
    };
}

/**
 * Remove member from group
 */
export async function removeMember({ groupId, memberUserId, requestingUserId }) {
    const group = await Group.findOne({ id: groupId });

    if (!group) {
        throw new Error('Group not found');
    }

    // Check if requesting user is the group admin
    if (group.createdBy !== requestingUserId) {
        throw new Error('Only group admin can remove members');
    }

    // Cannot remove the admin
    if (memberUserId === group.createdBy) {
        throw new Error('Cannot remove group admin');
    }

    // Remove member
    group.members = group.members.filter(member => member.userId !== memberUserId);

    await group.save();

    return group;
}

/**
 * Get group members with their details
 */
export async function getGroupMembers(groupId) {
    const group = await Group.findOne({ id: groupId });

    if (!group) {
        throw new Error('Group not found');
    }

    // Get all member user IDs
    const memberUserIds = group.members.map(m => m.userId);

    // Fetch user details
    const users = await User.find({ id: { $in: memberUserIds } });

    // Combine member info with user details
    const membersWithDetails = group.members.map(member => {
        const user = users.find(u => u.id === member.userId);
        return {
            userId: member.userId,
            joinedAt: member.joinedAt,
            email: user?.email,
            name: user?.name,
            profilePic: user?.profilePic,
            isAdmin: member.userId === group.createdBy
        };
    });

    return {
        groupId: group.id,
        groupName: group.name,
        createdBy: group.createdBy,
        members: membersWithDetails
    };
}

/**
 * Delete a group
 */
export async function deleteGroup({ groupId, requestingUserId }) {
    const group = await Group.findOne({ id: groupId });

    if (!group) {
        throw new Error('Group not found');
    }

    // Check if requesting user is the group admin
    if (group.createdBy !== requestingUserId) {
        throw new Error('Only group admin can delete the group');
    }

    await Group.deleteOne({ id: groupId });

    return { message: 'Group deleted successfully' };
}

/**
 * Update group name
 */
export async function updateGroupName({ groupId, name, requestingUserId }) {
    const group = await Group.findOne({ id: groupId });

    if (!group) {
        throw new Error('Group not found');
    }

    // Check if requesting user is the group admin
    if (group.createdBy !== requestingUserId) {
        throw new Error('Only group admin can update group name');
    }

    group.name = name;
    await group.save();

    return group;
}
