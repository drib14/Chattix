import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { setCredentials } from '../redux/slices/authSlice';
import ChattixLogo from '../components/ChattixLogo';

const OTPVerificationPage = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [canResend, setCanResend] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { userId, email } = location.state || {};

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    setCanResend(true);
  }, [countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error('Invalid verification request');
      navigate('/register');
      return;
    }

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.verifyOTP({ userId, otp });
      dispatch(setCredentials(response));
      toast.success(response.message || 'Email verified successfully!');
      navigate('/messages');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!userId || !canResend) return;

    setResending(true);
    try {
      const response = await authService.resendOTP({ userId });
      toast.success(response.message || 'OTP resent successfully');
      setCountdown(300);
      setCanResend(false);
      setOtp('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  return (
    <div className="min-h-screen bg-chattix-bg overflow-x-hidden flex flex-col">
      <div className="flex-1 flex items-center justify-center px-3 py-8 sm:px-4">
        <div className="max-w-md w-full">
          <div className="flex justify-center mb-6">
            <ChattixLogo size="md" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8 w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-chattix-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-chattix-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Verify your email
              </h1>
              <p className="text-gray-500 text-sm">
                We&apos;ve sent a 6-digit code to
              </p>
              {email && (
                <p className="text-chattix-secondary font-semibold mt-1 text-sm break-all px-2">
                  {email}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={handleOtpChange}
                  className="modern-input text-center text-xl sm:text-2xl tracking-[0.3em] font-bold"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <Clock size={16} className="shrink-0" />
                <span className={`font-medium ${countdown < 60 ? 'text-red-600' : ''}`}>
                  {countdown > 0 ? `Expires in ${formatTime(countdown)}` : 'OTP expired'}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6 || countdown === 0}
                className="button-primary w-full text-sm py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify email'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-gray-500 text-sm mb-2">Didn&apos;t receive the code?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || !canResend}
                className={`text-sm font-semibold ${
                  canResend
                    ? 'text-chattix-secondary hover:underline'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                {resending ? 'Resending...' : canResend ? 'Resend OTP' : `Resend in ${formatTime(countdown)}`}
              </button>
            </div>

            <div className="mt-5 p-3 sm:p-4 bg-chattix-bg rounded-xl">
              <p className="text-xs sm:text-sm text-gray-600">
                Check your spam folder if you don&apos;t see the email in your inbox.
              </p>
            </div>

            <p className="mt-4 text-center text-sm text-gray-500">
              <Link to="/register" className="text-chattix-secondary font-medium hover:underline">
                Back to register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
