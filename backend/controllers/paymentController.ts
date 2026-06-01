import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import axios from 'axios';
import { Transaction } from '../models/Transaction.js';

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

export const createPaymentIntent = async (req: AuthRequest, res: Response) => {
    const { amount, description } = req.body; // Amount in centavos (e.g., 10000 = 100 PHP)

    if (!amount) {
         res.status(400).json({ message: 'Amount is required' });
         return;
    }

    try {
        const options = {
            method: 'POST',
            url: 'https://api.paymongo.com/v1/payment_intents',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY as string).toString('base64')}`
            },
            data: {
                data: {
                    attributes: {
                        amount: amount,
                        payment_method_allowed: ['card', 'paymaya', 'gcash'],
                        payment_method_options: { card: { request_three_d_secure: 'any' } },
                        currency: 'PHP',
                        description: description || 'Chattix Transfer'
                    }
                }
            }
        };

        const response = await axios.request(options);

        // Note: For a complete system, we would create a Transaction record here.
        // For brevity, we return the client key to the frontend.

        res.status(200).json(response.data.data.attributes.client_key);

    } catch (error: any) {
        console.error("Paymongo Error: ", error.response?.data || error.message);
        res.status(500).json({ message: error.message });
    }
}