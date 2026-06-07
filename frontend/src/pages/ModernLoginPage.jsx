import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { setCredentials } from '../redux/slices/authSlice';
import ChattixLogo from '../components/ChattixLogo';
import AuthInput from '../components/AuthInput';

const ModernLoginPage = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const validate = () => {
    const next = {};
    if (!formData.identifier.trim()) next.identifier = 'Email or mobile is required';
    if (!formData.password) next.password = 'Password is required';
    else if (formData.password.length < 8) next.password = 'Minimum 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await authService.login(formData);
      dispatch(setCredentials(response));
      toast.success('Welcome to CHATTIX!');
      navigate('/messages');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chattix-bg flex items-center justify-center p-4 overflow-x-hidden">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 lg:gap-8 items-center">
        {/* Brand Section - Hidden on mobile */}
        <div className="hidden lg:flex flex-col justify-center items-center text-center p-8">
          <div className="mb-8">
            <ChattixLogo size="xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Welcome to CHATTIX
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-sm leading-relaxed">
            Connect with friends and family through secure, real-time messaging.
          </p>
          <div className="space-y-4 text-gray-500 text-sm">
            <div className="flex items-center gap-3 justify-center">
              <span className="w-2 h-2 rounded-full bg-chattix-primary" />
              <span>End-to-end encrypted messaging</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <span className="w-2 h-2 rounded-full bg-chattix-primary" />
              <span>Share photos, videos & documents</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <span className="w-2 h-2 rounded-full bg-chattix-primary" />
              <span>Create groups & communities</span>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="w-full">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <ChattixLogo size="lg" />
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 max-w-md mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Sign in</h2>
              <p className="text-gray-500 text-sm mt-2">
                Enter your credentials to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email Field */}
              <div>
                <AuthInput
                  label="Email or mobile"
                  id="identifier"
                  name="identifier"
                  type="text"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  placeholder="you@email.com"
                  inputClassName={`bg-gray-50 ${errors.identifier ? 'border-red-400' : 'border-gray-200'}`}
                  autoComplete="username"
                />
                {errors.identifier && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.identifier}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <AuthInput
                  label="Password"
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  inputClassName={`bg-gray-50 ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
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
                  autoComplete="current-password"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>
                )}
              </div>

              {/* Forgot Password */}
              <div className="flex items-center justify-end">
                <Link 
                  to="/forgot-password" 
                  className="text-sm font-medium text-chattix-primary hover:text-chattix-primary-dark transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-chattix-primary hover:bg-chattix-primary-dark text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Register Link */}
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-chattix-primary hover:text-chattix-primary-dark transition-colors"
              >
                Create account
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-gray-600">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModernLoginPage;