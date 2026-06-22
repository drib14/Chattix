import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema(
  {
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
    },
    emoji: {
      type: String,
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

reactionSchema.index({ message: 1, emoji: 1 }, { unique: true });

const Reaction = mongoose.model('Reaction', reactionSchema);
export default Reaction;
