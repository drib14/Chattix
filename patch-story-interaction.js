const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/controllers/storyController.js');
let content = fs.readFileSync(filePath, 'utf8');

// 3. Add Story Interaction Notification
if (!content.includes("type: 'story_interaction'")) {
  const reactEmitIdx = content.indexOf("if (io && story.user.toString() !== req.user._id.toString()) {\n      io.emit('story_reacted', { storyId: story._id, reactorId: req.user._id, ownerId: story.user, emoji });\n    }");
  
  if (reactEmitIdx !== -1) {
    const afterReactIdx = reactEmitIdx + "if (io && story.user.toString() !== req.user._id.toString()) {\n      io.emit('story_reacted', { storyId: story._id, reactorId: req.user._id, ownerId: story.user, emoji });\n    }".length;
    
    const reactNotifStr = `
    
    if (story.user.toString() !== req.user._id.toString()) {
      const currentUser = await User.findById(req.user._id);
      await Notification.create({
        recipient: story.user,
        sender: req.user._id,
        type: 'story_interaction',
        title: 'Story Reaction',
        body: \`\${currentUser ? (currentUser.fullName || currentUser.username) : 'Someone'} reacted to your story\`,
        data: { storyId: story._id, emoji }
      });
      if (io) io.to(story.user.toString()).emit('new_notification');
    }
`;
    content = content.slice(0, afterReactIdx) + reactNotifStr + content.slice(afterReactIdx);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Story Interaction patched');
