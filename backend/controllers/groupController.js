import Group from '../models/Group.js';
import Message from '../models/Message.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

// @desc    Create group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req, res) => {
  try {
    console.log('=== Group Creation Started ===');
    console.log('Request body:', req.body);

    // Accept both 'name' and 'groupName' for flexibility
    const groupName = req.body.name || req.body.groupName;
    const members = req.body.members;
    const description = req.body.description;

    console.log('Parsed data:', { groupName, membersCount: members?.length, description });

    if (!groupName || !groupName.trim()) {
      console.error('Group name is missing');
      return res.status(400).json({ message: 'Group name is required' });
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      console.error('Members are missing or empty');
      return res.status(400).json({ message: 'At least one member is required' });
    }

    // Add creator to members
    const allMembers = [...new Set([...members, req.user._id.toString()])];
    console.log('All members (including creator):', allMembers);

    const group = await Group.create({
      groupName,
      members: allMembers,
      admin: req.user._id,
      description,
    });

    await group.populate('members', 'fullName username avatar');
    await group.populate('admin', 'fullName username avatar');

    console.log('Group created successfully:', group._id);

    // Emit socket event to all members
    const io = req.app.get('io');
    allMembers.forEach((memberId) => {
      io.to(memberId).emit('group_created', group);
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('Group creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user groups
// @route   GET /api/groups
// @access  Private
export const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user._id,
    })
      .populate('members', 'fullName username avatar status')
      .populate('admin', 'fullName username avatar')
      .populate('admins', 'fullName username avatar')
      .populate({
        path: 'pinnedMessage',
        populate: { path: 'sender', select: 'fullName username avatar' },
      })
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get group by ID
// @route   GET /api/groups/:groupId
// @access  Private
export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('members', 'fullName username avatar status')
      .populate('admin', 'fullName username avatar')
      .populate('admins', 'fullName username avatar')
      .populate({
        path: 'pinnedMessage',
        populate: { path: 'sender', select: 'fullName username avatar' },
      });

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member
    if (!group.members.some((m) => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update group
// @route   PUT /api/groups/:groupId
// @access  Private
export const updateGroup = async (req, res) => {
  try {
    const { groupName, description } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can update group' });
    }

    if (groupName) group.groupName = groupName;
    if (description !== undefined) group.description = description;

    await group.save();
    await group.populate('members', 'fullName username avatar');

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload group avatar
// @route   POST /api/groups/:groupId/avatar
// @access  Private
export const uploadGroupAvatar = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        message:
          'Image upload is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env',
      });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can update group avatar' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'chat-app/groups',
          transformation: [{ width: 200, height: 200, crop: 'fill' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    group.groupAvatar = result.secure_url;
    await group.save();

    res.json({
      message: 'Group avatar updated',
      groupAvatar: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add members to group
// @route   POST /api/groups/:groupId/members
// @access  Private
export const addMembers = async (req, res) => {
  try {
    const { members } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can add members' });
    }

    // Add new members
    members.forEach((memberId) => {
      if (!group.members.includes(memberId)) {
        group.members.push(memberId);
      }
    });

    await group.save();
    await group.populate('members', 'fullName username avatar');

    // Emit socket event
    const io = req.app.get('io');
    members.forEach((memberId) => {
      io.to(memberId).emit('added_to_group', group);
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove member from group
// @route   DELETE /api/groups/:groupId/members/:memberId
// @access  Private
export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can remove members' });
    }

    // Cannot remove admin
    if (memberId === group.admin.toString()) {
      return res.status(400).json({ message: 'Cannot remove admin' });
    }

    group.members = group.members.filter((m) => m.toString() !== memberId);
    await group.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(memberId).emit('removed_from_group', { groupId });

    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Leave group
// @route   POST /api/groups/:groupId/leave
// @access  Private
export const leaveGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Admin cannot leave, must transfer admin first
    if (group.admin.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Admin must transfer admin rights before leaving',
      });
    }

    group.members = group.members.filter(
      (m) => m.toString() !== req.user._id.toString()
    );
    await group.save();

    res.json({ message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete group
// @route   DELETE /api/groups/:groupId
// @access  Private
export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can delete group' });
    }

    await group.deleteOne();

    // Emit socket event to all members
    const io = req.app.get('io');
    group.members.forEach((memberId) => {
      io.to(memberId.toString()).emit('group_deleted', { groupId: group._id });
    });

    res.json({ message: 'Group deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Promote member to admin
// @route   POST /api/groups/:groupId/members/:memberId/promote
// @access  Private
export const promoteToAdmin = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const group = await Group.findById(groupId).populate('admins', 'fullName');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin or owner
    const isAdmin = group.admin.toString() === req.user._id.toString() ||
      group.admins.some(a => a._id.toString() === req.user._id.toString());

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admin can promote members' });
    }

    // Check if member exists
    if (!group.members.some(m => m.toString() === memberId)) {
      return res.status(400).json({ message: 'Member not found in group' });
    }

    // Check if already admin
    if (group.admins.some(a => a.toString() === memberId)) {
      return res.status(400).json({ message: 'Member is already admin' });
    }

    group.admins.push(memberId);
    await group.save();
    await group.populate('admins', 'fullName username avatar');

    // Emit socket event
    const io = req.app.get('io');
    io.to(groupId).emit('member_promoted', {
      memberId,
      groupId,
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Demote admin to member
// @route   POST /api/groups/:groupId/members/:memberId/demote
// @access  Private
export const demoteAdmin = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only owner can demote
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only group owner can demote admins' });
    }

    // Cannot demote owner
    if (memberId === group.admin.toString()) {
      return res.status(400).json({ message: 'Cannot demote group owner' });
    }

    group.admins = group.admins.filter(a => a.toString() !== memberId);
    await group.save();
    await group.populate('admins', 'fullName username avatar');

    // Emit socket event
    const io = req.app.get('io');
    io.to(groupId).emit('member_demoted', {
      memberId,
      groupId,
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Transfer admin role
// @route   POST /api/groups/:groupId/transfer-admin/:newAdminId
// @access  Private
export const transferAdmin = async (req, res) => {
  try {
    const { groupId, newAdminId } = req.params;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only current admin can transfer
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can transfer admin role' });
    }

    // Check if new admin is member
    if (!group.members.some(m => m.toString() === newAdminId)) {
      return res.status(400).json({ message: 'New admin must be group member' });
    }

    const oldAdmin = group.admin;
    group.admin = newAdminId;

    // Remove from admins array if present and add to admins
    group.admins = group.admins.filter(a => a.toString() !== newAdminId);
    if (!group.admins.includes(oldAdmin)) {
      group.admins.push(oldAdmin);
    }

    await group.save();
    await group.populate('admin', 'fullName username avatar');
    await group.populate('admins', 'fullName username avatar');

    // Emit socket event
    const io = req.app.get('io');
    io.to(groupId).emit('admin_transferred', {
      oldAdmin,
      newAdmin: newAdminId,
      groupId,
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove group avatar
// @route   DELETE /api/groups/:groupId/avatar
// @access  Private
export const removeGroupAvatar = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can remove group avatar' });
    }

    group.groupAvatar = 'https://res.cloudinary.com/demo/image/upload/group-default.png';
    await group.save();

    res.json({ message: 'Group avatar removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get group members (with optional search)
// @route   GET /api/groups/:groupId/members
// @access  Private
export const getGroupMembers = async (req, res) => {
  try {
    const { search } = req.query;
    const group = await Group.findById(req.params.groupId)
      .populate({
        path: 'members',
        select: 'fullName username avatar status',
        match: search ? {
          $or: [
            { fullName: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } },
          ],
        } : {},
      })
      .populate('admin', 'fullName username avatar')
      .populate('admins', 'fullName username avatar');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member
    if (!group.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      members: group.members,
      admin: group.admin,
      admins: group.admins,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Regenerate invite code
// @route   POST /api/groups/:groupId/regenerate-invite
// @access  Private
export const regenerateInviteCode = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can regenerate invite code' });
    }

    // Generate new unique code
    let newCode;
    let exists = true;
    while (exists) {
      newCode = crypto.randomBytes(8).toString('hex');
      exists = await Group.findOne({ inviteCode: newCode });
    }

    group.inviteCode = newCode;
    await group.save();

    res.json({ inviteCode: newCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join group via invite code
// @route   POST /api/groups/join/:inviteCode
// @access  Private
export const joinGroupViaInvite = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const group = await Group.findOne({
      inviteCode,
      inviteCodeEnabled: true,
    }).populate('members', 'fullName username avatar');

    if (!group) {
      return res.status(404).json({ message: 'Invalid or expired invite code' });
    }

    // Check if already member
    if (group.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'You are already member of this group' });
    }

    group.members.push(req.user._id);
    await group.save();
    await group.populate('members', 'fullName username avatar');
    await group.populate('admin', 'fullName username avatar');

    // Emit socket event
    const io = req.app.get('io');
    io.to(group._id.toString()).emit('member_joined', {
      user: {
        _id: req.user._id,
        fullName: req.user.fullName,
        username: req.user.username,
        avatar: req.user.avatar,
      },
      groupId: group._id,
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update group settings
// @route   PUT /api/groups/:groupId/settings
// @access  Private
export const updateGroupSettings = async (req, res) => {
  try {
    const { groupName, description, groupRules, announcementMode, inviteCodeEnabled } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can update group settings' });
    }

    if (groupName) group.groupName = groupName;
    if (description !== undefined) group.description = description;
    if (groupRules !== undefined) group.groupRules = groupRules;
    if (announcementMode !== undefined) group.announcementMode = announcementMode;
    if (inviteCodeEnabled !== undefined) group.inviteCodeEnabled = inviteCodeEnabled;

    await group.save();
    await group.populate('members', 'fullName username avatar');

    // Emit socket event
    const io = req.app.get('io');
    io.to(req.params.groupId).emit('group_settings_updated', group);

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pin message
// @route   POST /api/groups/:groupId/pin-message/:messageId
// @access  Private
export const pinMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can pin messages' });
    }

    // Verify message exists and belongs to group
    const message = await Message.findById(messageId);
    if (!message || message.group.toString() !== groupId) {
      return res.status(404).json({ message: 'Message not found in this group' });
    }

    group.pinnedMessage = messageId;
    await group.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(groupId).emit('message_pinned', {
      groupId,
      messageId,
    });

    res.json({ message: 'Message pinned' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get group media and files
// @route   GET /api/groups/:groupId/media
// @access  Private
export const getGroupMedia = async (req, res) => {
  try {
    const { type = 'all', page = 1, limit = 20 } = req.query;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member
    if (!group.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let query = { group: req.params.groupId };

    if (type === 'media') {
      query.attachments = { $elemMatch: { type: { $in: ['image', 'video', 'audio'] } } };
    } else if (type === 'files') {
      query.attachments = { $elemMatch: { type: 'document' } };
    } else if (type === 'links') {
      query.text = { $regex: 'http', $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const messages = await Message.find(query)
      .populate('sender', 'fullName username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(query);

    res.json({
      messages,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
