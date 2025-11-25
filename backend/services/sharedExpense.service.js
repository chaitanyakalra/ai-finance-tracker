import SharedExpense from '../models/SharedExpense.js';
import Group from '../models/Group.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a shared expense and split it among group members
 */
export async function createSharedExpense({
    groupId,
    createdBy,
    description,
    amount,
    category,
    date,
    splitType = 'equal', // 'equal', 'select', or 'full'
    selectedMembers = [] // Array of userIds for custom split
}) {
    // Verify group exists
    const group = await Group.findOne({ id: groupId });

    if (!group) {
        throw new Error('Group not found');
    }

    // Verify user is a member of the group
    const isMember = group.members.some(member => member.userId === createdBy);
    if (!isMember) {
        throw new Error('You are not a member of this group');
    }

    // IMPORTANT: Filter out the creator from selectedMembers
    // The creator cannot owe themselves money!
    const validSelectedMembers = selectedMembers.filter(userId => userId !== createdBy);

    let splits = [];

    if (splitType === 'full' && validSelectedMembers.length === 1) {
        // One person owes the full amount
        splits = [{
            userId: validSelectedMembers[0],
            amount: parseFloat(amount.toFixed(2))
        }];
    } else if (splitType === 'select' && validSelectedMembers.length > 0) {
        // Split among selected members only (excluding creator)
        const memberCount = validSelectedMembers.length;
        const splitAmount = amount / memberCount;

        splits = validSelectedMembers.map(userId => ({
            userId,
            amount: parseFloat(splitAmount.toFixed(2))
        }));
    } else {
        // Split equally among all members EXCEPT the creator
        const otherMembers = group.members.filter(member => member.userId !== createdBy);
        const memberCount = otherMembers.length;
        const splitAmount = amount / memberCount;

        splits = otherMembers.map(member => ({
            userId: member.userId,
            amount: parseFloat(splitAmount.toFixed(2))
        }));
    }

    // Adjust for rounding errors - add/subtract difference to first person in splits
    const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
    const difference = amount - totalSplit;

    if (difference !== 0 && splits.length > 0) {
        // Add difference to first person (since creator is not in splits)
        splits[0].amount = parseFloat((splits[0].amount + difference).toFixed(2));
    }

    const sharedExpense = new SharedExpense({
        id: uuidv4(),
        groupId,
        createdBy,
        description,
        amount,
        category,
        date,
        splits
    });

    await sharedExpense.save();
    return sharedExpense;
}

/**
 * Get all shared expenses for a group
 */
export async function getGroupExpenses(groupId, userId) {
    // Verify user is a member of the group
    const group = await Group.findOne({ id: groupId });

    if (!group) {
        throw new Error('Group not found');
    }

    const isMember = group.members.some(member => member.userId === userId);
    if (!isMember) {
        throw new Error('You are not a member of this group');
    }

    const expenses = await SharedExpense.find({ groupId }).sort({ createdAt: -1 });
    return expenses;
}

/**
 * Get all shared expenses for a user across all their groups
 */
export async function getUserSharedExpenses(userId) {
    // Find all groups user is a member of
    const groups = await Group.find({ 'members.userId': userId });
    const groupIds = groups.map(g => g.id);

    // Get all shared expenses from these groups
    const expenses = await SharedExpense.find({
        groupId: { $in: groupIds }
    }).sort({ createdAt: -1 });

    return expenses;
}

/**
 * Calculate balance for a user in a group (who owes whom)
 */
export async function getGroupBalance(groupId, userId) {
    // Verify user is a member
    const group = await Group.findOne({ id: groupId });

    if (!group) {
        throw new Error('Group not found');
    }

    const isMember = group.members.some(member => member.userId === userId);
    if (!isMember) {
        throw new Error('You are not a member of this group');
    }

    const expenses = await SharedExpense.find({ groupId });

    // Calculate balances
    const balances = {};

    // Initialize balances for all members
    group.members.forEach(member => {
        balances[member.userId] = 0;
    });

    // Process each expense
    expenses.forEach(expense => {
        // The creator paid the full amount
        balances[expense.createdBy] += expense.amount;

        // Each member owes their split
        expense.splits.forEach(split => {
            balances[split.userId] -= split.amount;
        });
    });

    return {
        groupId,
        groupName: group.name,
        balances,
        userBalance: balances[userId] || 0
    };
}

/**
 * Get expense by ID
 */
export async function getSharedExpenseById(expenseId, userId) {
    const expense = await SharedExpense.findOne({ id: expenseId });

    if (!expense) {
        throw new Error('Expense not found');
    }

    // Verify user is a member of the group
    const group = await Group.findOne({ id: expense.groupId });
    const isMember = group.members.some(member => member.userId === userId);

    if (!isMember) {
        throw new Error('You are not authorized to view this expense');
    }

    return expense;
}

/**
 * Get total amount owed to the user across all groups
 */
export async function getTotalAmountOwed(userId) {
    const groups = await Group.find({ 'members.userId': userId });
    const groupIds = groups.map(g => g.id);
    const expenses = await SharedExpense.find({
        groupId: { $in: groupIds },
        createdBy: userId
    });

    let totalOwed = 0;
    expenses.forEach(expense => {
        expense.splits.forEach(split => {
            if (split.userId !== userId) {
                totalOwed += split.amount;
            }
        });
    });

    return {
        totalOwed: parseFloat(totalOwed.toFixed(2)),
        expenseCount: expenses.length
    };
}

/**
 * Get breakdown of amount owed by each person
 * Returns an array of { userId, name, email, amount } for pie chart display
 */
export async function getAmountOwedByPerson(userId) {
    const groups = await Group.find({ 'members.userId': userId });
    const groupIds = groups.map(g => g.id);

    // Get all expenses created by this user
    const expenses = await SharedExpense.find({
        groupId: { $in: groupIds },
        createdBy: userId
    });

    // Create a map to track amount owed by each person
    const owedByPerson = {};

    // Process each expense
    expenses.forEach(expense => {
        expense.splits.forEach(split => {
            if (split.userId !== userId) {
                if (!owedByPerson[split.userId]) {
                    owedByPerson[split.userId] = 0;
                }
                owedByPerson[split.userId] += split.amount;
            }
        });
    });

    // Import User model to get actual user names
    const User = (await import('../models/User.js')).default;

    // Get user details for each person who owes money
    const result = [];
    for (const [personUserId, amount] of Object.entries(owedByPerson)) {
        // Fetch user from User table
        const user = await User.findOne({ id: personUserId });

        // Fallback to group member details if user not found
        let personDetails = null;
        if (!user) {
            for (const group of groups) {
                const member = group.members.find(m => m.userId === personUserId);
                if (member) {
                    personDetails = member;
                    break;
                }
            }
        }

        const name = user?.name || personDetails?.name || 'User';
        const email = user?.email || personDetails?.email || 'Unknown';

        result.push({
            userId: personUserId,
            name: name,
            email: email,
            amount: parseFloat(amount.toFixed(2))
        });
    }

    // Sort by amount descending
    result.sort((a, b) => b.amount - a.amount);

    return result;
}

/**
 * Get breakdown of amount the user owes to others
 * Returns an array of { userId, name, email, amount } for pie chart display
 */
export async function getAmountIOweByPerson(userId) {
    const groups = await Group.find({ 'members.userId': userId });
    const groupIds = groups.map(g => g.id);

    // Get all expenses created by OTHERS in these groups
    const expenses = await SharedExpense.find({
        groupId: { $in: groupIds },
        createdBy: { $ne: userId } // Not created by me
    });

    // Create a map to track amount I owe to each person (creator)
    const iOweToPerson = {};

    // Process each expense
    expenses.forEach(expense => {
        // Check if I am in the splits
        const mySplit = expense.splits.find(split => split.userId === userId);

        if (mySplit) {
            // I owe this amount to the creator
            const creditorId = expense.createdBy;
            if (!iOweToPerson[creditorId]) {
                iOweToPerson[creditorId] = 0;
            }
            iOweToPerson[creditorId] += mySplit.amount;
        }
    });

    // Import User model to get actual user names
    const User = (await import('../models/User.js')).default;

    // Get user details for each creditor
    const result = [];
    for (const [creditorId, amount] of Object.entries(iOweToPerson)) {
        // Fetch user from User table
        const user = await User.findOne({ id: creditorId });

        // Fallback to group member details if user not found
        let personDetails = null;
        if (!user) {
            for (const group of groups) {
                const member = group.members.find(m => m.userId === creditorId);
                if (member) {
                    personDetails = member;
                    break;
                }
            }
        }

        const name = user?.name || personDetails?.name || 'User';
        const email = user?.email || personDetails?.email || 'Unknown';

        result.push({
            userId: creditorId,
            name: name,
            email: email,
            amount: parseFloat(amount.toFixed(2))
        });
    }

    // Sort by amount descending
    result.sort((a, b) => b.amount - a.amount);

    return result;
}
