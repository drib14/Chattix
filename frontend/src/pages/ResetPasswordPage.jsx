import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import ChattixLogo from '../components/ChattixLogo';
import AuthInput from '../components/AuthInput';

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { userId, email } = location.state || {};

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error('Invalid reset request');
      navigate('/forgot-password');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword({
        userId,
        otp: formData.otp,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed');
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
              to="/forgot-password"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-5 sm:mb-6 text-sm"
            >
              <ArrowLeft size={18} className="mr-2 shrink-0" />
              Back
            </Link>

            <div className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Reset password
              </h1>
              <p className="text-gray-500 text-sm break-words">
                Enter the OTP sent to {email || 'your email'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  name="otp"
                  inputMode="numeric"
                  value={formData.otp}
                  onChange={handleChange}
                  className="modern-input text-center text-lg tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              <AuthInput
                label="New password"
                id="newPassword"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                inputClassName="border-gray-200"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                }
                required
              />

              <AuthInput
                label="Confirm password"
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                inputClassName="border-gray-200"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="button-primary w-full text-sm py-3 disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              <Link to="/login" className="text-chattix-secondary font-medium hover:underline">
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
