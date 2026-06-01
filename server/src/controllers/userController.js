import User from '../models/User.js';

// @desc    Search users by username or email (to add as contact)
// @route   GET /api/users/search
// @access  Private
export const searchUsers = async (req, res) => {
  const { query } = req.query;

  try {
    let searchCriteria = {};
    
    if (query && query.trim() !== '') {
      searchCriteria = {
        _id: { $ne: req.user._id },
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      };
    } else {
      // Empty query returns all other registered users (limit 20)
      searchCriteria = { _id: { $ne: req.user._id } };
    }

    const users = await User.find(searchCriteria)
      .select('username email profilePhoto statusText')
      .limit(20);

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('[Search Users Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
};

// @desc    Update user profile (statusText, profilePhoto)
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  const { statusText, profilePhoto } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (statusText !== undefined) user.statusText = statusText;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePhoto: user.profilePhoto,
        statusText: user.statusText,
        contacts: user.contacts,
      },
    });
  } catch (error) {
    console.error('[Update Profile Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// @desc    Send contact request
// @route   POST /api/users/contacts/request
// @access  Private
export const sendContactRequest = async (req, res) => {
  const { recipientId } = req.body;
  const senderId = req.user._id;

  try {
    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required' });
    }

    if (senderId.toString() === recipientId) {
      return res.status(400).json({ success: false, message: 'You cannot add yourself' });
    }

    const recipient = await User.findById(recipientId);
    const sender = await User.findById(senderId);

    if (!recipient || !sender) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already contacts
    if (sender.contacts.includes(recipientId)) {
      return res.status(400).json({ success: false, message: 'User is already in your contacts' });
    }

    // Check if request already pending
    const isRequestPending = recipient.pendingRequests.some(
      (req) => req.sender.toString() === senderId.toString()
    );
    if (isRequestPending) {
      return res.status(400).json({ success: false, message: 'Contact request is already pending' });
    }

    // Add to recipient's pendingRequests
    recipient.pendingRequests.push({ sender: senderId });
    await recipient.save();

    // Add to sender's sentRequests
    sender.sentRequests.push({ recipient: recipientId });
    await sender.save();

    res.status(200).json({ success: true, message: 'Contact request sent successfully!' });
  } catch (error) {
    console.error('[Send Request Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to send contact request' });
  }
};

// @desc    Accept contact request
// @route   POST /api/users/contacts/accept
// @access  Private
export const acceptContactRequest = async (req, res) => {
  const { senderId } = req.body; // The user who sent the request originally
  const recipientId = req.user._id;

  try {
    const recipient = await User.findById(recipientId);
    const sender = await User.findById(senderId);

    if (!recipient || !sender) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if request actually exists
    const requestIndex = recipient.pendingRequests.findIndex(
      (req) => req.sender.toString() === senderId.toString()
    );

    if (requestIndex === -1) {
      return res.status(400).json({ success: false, message: 'No pending request from this user' });
    }

    // Remove from recipient's pendingRequests
    recipient.pendingRequests.splice(requestIndex, 1);

    // Add to contacts
    if (!recipient.contacts.includes(senderId)) {
      recipient.contacts.push(senderId);
    }
    await recipient.save();

    // Remove from sender's sentRequests
    const sentIndex = sender.sentRequests.findIndex(
      (req) => req.recipient.toString() === recipientId.toString()
    );
    if (sentIndex !== -1) {
      sender.sentRequests.splice(sentIndex, 1);
    }

    // Add to sender's contacts
    if (!sender.contacts.includes(recipientId)) {
      sender.contacts.push(recipientId);
    }
    await sender.save();

    res.status(200).json({
      success: true,
      message: 'Contact request accepted!',
      contacts: recipient.contacts,
    });
  } catch (error) {
    console.error('[Accept Request Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to accept contact request' });
  }
};

// @desc    Reject contact request
// @route   POST /api/users/contacts/reject
// @access  Private
export const rejectContactRequest = async (req, res) => {
  const { senderId } = req.body;
  const recipientId = req.user._id;

  try {
    const recipient = await User.findById(recipientId);
    const sender = await User.findById(senderId);

    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    // Remove from recipient's pendingRequests
    recipient.pendingRequests = recipient.pendingRequests.filter(
      (req) => req.sender.toString() !== senderId
    );
    await recipient.save();

    // Remove from sender's sentRequests if sender exists
    if (sender) {
      sender.sentRequests = sender.sentRequests.filter(
        (req) => req.recipient.toString() !== recipientId.toString()
      );
      await sender.save();
    }

    res.status(200).json({ success: true, message: 'Contact request declined' });
  } catch (error) {
    console.error('[Reject Request Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to decline contact request' });
  }
};

// @desc    Get contacts & pending requests list
// @route   GET /api/users/contacts
// @access  Private
export const getContacts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('contacts', 'username email profilePhoto statusText isOnline lastSeen')
      .populate('pendingRequests.sender', 'username email profilePhoto statusText')
      .populate('sentRequests.recipient', 'username email profilePhoto statusText')
      .populate('blockedUsers', 'username email profilePhoto')
      .populate('favoriteContacts', 'username email profilePhoto statusText isOnline lastSeen');

    res.status(200).json({
      success: true,
      contacts: user.contacts,
      pendingRequests: user.pendingRequests,
      sentRequests: user.sentRequests,
      blockedUsers: user.blockedUsers,
      favoriteContacts: user.favoriteContacts,
    });
  } catch (error) {
    console.error('[Get Contacts Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contacts list' });
  }
};

// @desc    Toggle favorite status of a contact
// @route   POST /api/users/contacts/favorite
// @access  Private
export const toggleFavorite = async (req, res) => {
  const { contactId } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const index = user.favoriteContacts.indexOf(contactId);
    let isFavorite = false;

    if (index === -1) {
      user.favoriteContacts.push(contactId);
      isFavorite = true;
    } else {
      user.favoriteContacts.splice(index, 1);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: isFavorite ? 'Added to favorites' : 'Removed from favorites',
      favoriteContacts: user.favoriteContacts,
    });
  } catch (error) {
    console.error('[Toggle Favorite Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle favorite status' });
  }
};

// @desc    Remove contact
// @route   DELETE /api/users/contacts/:id
// @access  Private
export const removeContact = async (req, res) => {
  const contactId = req.params.id;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    const contact = await User.findById(contactId);

    if (user) {
      user.contacts = user.contacts.filter((id) => id.toString() !== contactId);
      user.favoriteContacts = user.favoriteContacts.filter((id) => id.toString() !== contactId);
      await user.save();
    }

    if (contact) {
      contact.contacts = contact.contacts.filter((id) => id.toString() !== userId.toString());
      contact.favoriteContacts = contact.favoriteContacts.filter((id) => id.toString() !== userId.toString());
      await contact.save();
    }

    res.status(200).json({ success: true, message: 'Contact removed successfully' });
  } catch (error) {
    console.error('[Remove Contact Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to remove contact' });
  }
};
