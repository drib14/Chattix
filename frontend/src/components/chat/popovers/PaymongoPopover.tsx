import React, { useState } from 'react';
import { Popover } from '@headlessui/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import useAuthStore from '../../../store/authStore';

interface PaymongoPopoverProps {
    onPaymentSuccess: (paymentIntentId: string, amount: number) => void;
    children: React.ReactNode;
}

const PaymongoPopover: React.FC<PaymongoPopoverProps> = ({ onPaymentSuccess, children }) => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuthStore();

    const handleCreatePayment = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
                withCredentials: true,
            };

            // Amount in centavos
            const amountInCentavos = Math.round(Number(amount) * 100);

            const { data } = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/payments/create-intent`,
                { amount: amountInCentavos, description: 'Chattix Transfer' },
                config
            );

            // In a real app, we would redirect to a checkout page here or use Paymongo Elements.
            // Since we are mocking the UI flow for the clone, we will just simulate success.
            toast.success(`Payment Intent Created! Simulating success...`);
            onPaymentSuccess(data, Number(amount));
            setAmount('');
        } catch (error) {
            toast.error('Failed to create payment link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popover className="relative">
            <Popover.Button as="div" className="cursor-pointer focus:outline-none">
                {children}
            </Popover.Button>

            <Popover.Panel className="absolute bottom-full mb-2 right-0 z-50 w-64 bg-[var(--color-bg-dark-secondary)] rounded-xl shadow-xl border border-[var(--color-border-dark)] p-4 text-center">
                <p className="text-white mb-4 text-sm font-semibold">Send Money (PHP)</p>
                <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-[var(--color-bg-dark)] border border-[var(--color-border-dark)] rounded-lg px-3 py-2 text-white mb-4 focus:outline-none focus:border-[var(--color-primary)]"
                />
                <button
                    onClick={handleCreatePayment}
                    disabled={loading}
                    className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50"
                >
                    {loading ? 'Processing...' : 'Send'}
                </button>
            </Popover.Panel>
        </Popover>
    );
};

export default PaymongoPopover;