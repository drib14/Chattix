import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import ChattixLogo from '../components/ChattixLogo';
import AuthInput from '../components/AuthInput';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.forgotPassword({ email });
      toast.success(response.message);
      navigate('/reset-password', { state: { userId: response.userId, email } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chattix-bg overflow-x-hidden flex flex-col">
      <div className="flex-1 flex items-center justify-center px-3 py-8 sm:px-4">
        <div className="max-w-md w-full">
          <div className="flex justify-center mb-6">
            <ChattixLogo size="md" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8 w-full">
            <Link
              to="/login"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-5 sm:mb-6 text-sm"
            >
              <ArrowLeft size={18} className="mr-2 shrink-0" />
              Back to sign in
            </Link>

            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Forgot password?
              </h1>
              <p className="text-gray-500 text-sm">
                Enter your email to receive a password reset OTP
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <AuthInput
                  label="Email address"
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  inputClassName="border-gray-200"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="button-primary w-full text-sm py-3 disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
