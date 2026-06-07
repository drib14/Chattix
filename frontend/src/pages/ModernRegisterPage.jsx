import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';
import ChattixLogo from '../components/ChattixLogo';
import AuthInput from '../components/AuthInput';
import toast from 'react-hot-toast';

const ModernRegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error('Full name is required');
      return false;
    }
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!formData.mobileNumber.trim()) {
      toast.error('Mobile number is required');
      return false;
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authService.register(formData);
      toast.success('Registration successful! Please verify your OTP.');
      navigate('/verify-otp', { state: { userId: response.userId, email: response.email } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chattix-bg overflow-x-hidden">
      <div className="min-h-screen grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-center items-center bg-chattix-primary text-white p-12">
          <ChattixLogo size="lg" className="mb-8 [&_span]:text-white" />
          <h1 className="text-3xl font-bold mb-3 text-center">Join CHATTIX</h1>
          <p className="text-white/85 text-center max-w-sm text-lg leading-relaxed">
            Create your account and start connecting with friends today.
          </p>
          <ul className="mt-10 space-y-3 text-white/90 text-sm">
            {['Free to use', 'Secure messaging', 'Real-time updates'].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-center px-3 py-8 sm:px-8 lg:px-16 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-md mx-auto my-4 sm:my-8">
            <div className="lg:hidden mb-6 flex justify-center">
              <ChattixLogo size="md" />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8 w-full">
              <div className="mb-5 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create account</h2>
                <p className="text-gray-500 text-sm mt-1">Join CHATTIX today</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <AuthInput
                  label="Full Name"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  inputClassName="border-gray-200"
                  required
                />

                <AuthInput
                  label="Username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  inputClassName="border-gray-200"
                  required
                />

                <AuthInput
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  inputClassName="border-gray-200"
                  required
                />

                <AuthInput
                  label="Mobile"
                  name="mobileNumber"
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  inputClassName="border-gray-200"
                  required
                />

                <AuthInput
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
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
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  inputClassName="border-gray-200"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                  }
                  required
                />

                <button
                  type="submit"

                  disabled={loading}

                  className="button-primary w-full text-sm py-3 disabled:opacity-50"

                >

                  {loading ? 'Creating Account...' : 'Create Account'}

                </button>

              </form>



              <p className="mt-5 text-center text-sm text-gray-500">

                Already have an account?{' '}

                <Link to="/login" className="text-chattix-secondary font-semibold hover:underline">

                  Sign in

                </Link>

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};



export default ModernRegisterPage;

