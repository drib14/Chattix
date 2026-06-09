const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/server.js');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('checkExpiredStories')) {
  const listenIdx = content.indexOf('httpServer.listen(PORT, () => {');
  
  const expirationJobStr = `
// Background job to check for expired stories
const checkExpiredStories = async () => {
  try {
    const { default: Story } = await import('./models/Story.js');
    const { default: Notification } = await import('./models/Notification.js');
    const io = app.get('io');
    
    // Find stories that have expired but haven't been notified yet
    const expiredStories = await Story.find({
      expiresAt: { $lte: new Date() },
      isExpiredNotified: { $ne: true }
    });

    if (expiredStories.length > 0) {
      for (const story of expiredStories) {
        // Send notification to the owner
        await Notification.create({
          recipient: story.user,
          type: 'story_expiration',
          title: 'Story Expired',
          body: 'Your story has expired and is no longer visible to others.',
          data: { storyId: story._id }
        });
        
        if (io) {
          io.to(story.user.toString()).emit('new_notification');
        }

        // Mark as notified so we don't spam
        story.isExpiredNotified = true;
        await story.save();
      }
    }
  } catch (err) {
    console.error('Error checking expired stories:', err);
  }
};

// Run every 5 minutes
setInterval(checkExpiredStories, 5 * 60 * 1000);
// Also run once on startup
setTimeout(checkExpiredStories, 10000);

`;

  content = content.slice(0, listenIdx) + expirationJobStr + content.slice(listenIdx);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Server patched for story expiration job');
} else {
  console.log('Job already exists');
}
