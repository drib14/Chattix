import mongoose, { Schema } from 'mongoose';

const transactionSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'PHP' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    paymentIntentId: { type: String, required: true },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
