const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/controllers/storyController.js');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("import Notification from '../models/Notification.js';")) {
  content = content.replace("import User from '../models/User.js';", "import User from '../models/User.js';\nimport Notification from '../models/Notification.js';");
}

// 1. Add Story Creation Notification
if (!content.includes("type: 'story_creation'")) {
  const ioEmitIdx = content.indexOf("if (io) {\n      io.emit('new_story', story);\n    }");
  if (ioEmitIdx !== -1) {
    const afterEmitIdx = ioEmitIdx + "if (io) {\n      io.emit('new_story', story);\n    }".length;
    const notificationStr = `

    // Notify friends of story creation
    const currentUser = await User.findById(req.user._id);
    if (currentUser && currentUser.friends && currentUser.friends.length > 0) {
      const notifications = currentUser.friends.map(friendId => ({
        recipient: friendId,
        sender: req.user._id,
        type: 'story_creation',
        title: 'New Story',
        body: \`\${currentUser.fullName || currentUser.username} added to their story\`,
        data: { storyId: story._id }
      }));
      await Notification.insertMany(notifications);
      if (io) {
        currentUser.friends.forEach(friendId => {
          io.to(friendId.toString()).emit('new_notification');
        });
      }
    }
`;
    content = content.slice(0, afterEmitIdx) + notificationStr + content.slice(afterEmitIdx);
  }
}

// 2. Add Story Tagged Notification
if (!content.includes("type: 'story_tagged'")) {
  const mentionMsgCreationIdx = content.indexOf("const mentionMessage = await Message.create({");
  if (mentionMsgCreationIdx !== -1) {
    const mentionMsgInsertIdx = content.indexOf("});", mentionMsgCreationIdx) + 3;
    const tagNotifStr = `
            
            await Notification.create({
              recipient: tag.userId,
              sender: req.user._id,
              type: 'story_tagged',
              title: 'Story Mention',
              body: \`\${currentUser ? (currentUser.fullName || currentUser.username) : 'Someone'} mentioned you in their story\`,
              data: { storyId: story._id }
            });
            if (io) io.to(tag.userId.toString()).emit('new_notification');
`;
    content = content.slice(0, mentionMsgInsertIdx) + tagNotifStr + content.slice(mentionMsgInsertIdx);
  }
}

// 3. Story Interaction Notification (inside reactToStory and replyToStory)
// we need to view storyController first if reactToStory exists. Let's assume it exists or we can just append a function?
// I will just replace `res.json(story);` in reactToStory and replyToStory if it exists.
// Wait, I should better view the whole storyController.js before writing this script perfectly.

fs.writeFileSync(filePath, content, 'utf8');
console.log('Story Controller patched');
