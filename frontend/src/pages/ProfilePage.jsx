import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateUser } from '../redux/slices/authSlice';
import { userService } from '../services/userService';

const DEFAULT_AVATAR =
  'https://ui-avatars.com/api/?background=3B82F6&color=fff&bold=true';

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    statusMessage: user?.statusMessage || '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar || `${DEFAULT_AVATAR}&name=${encodeURIComponent(user?.fullName || 'U')}`
  );
  const [coverPreview, setCoverPreview] = useState(
    user?.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=60'
  );
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        bio: user.bio || '',
        statusMessage: user.statusMessage || '',
      });
    }
  }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);

    try {
      let updated = { ...formData };

      if (avatarFile) {
        const data = await userService.uploadAvatar(avatarFile, setUploadProgress);
        updated.avatar = data.avatar;
      }
      if (coverFile) {
        const data = await userService.uploadCover(coverFile);
        updated.coverImage = data.coverImage;
      }

      const response = await userService.updateProfile(formData);
      updated = { ...updated, ...response.user };
      dispatch(updateUser(updated));
      toast.success('Profile updated');
      navigate('/messages');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-chattix-bg overflow-x-hidden">
      <div className="max-w-lg mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 pb-nav lg:pb-6">
        <button type="button" onClick={() => navigate('/messages')} className="flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm font-medium">
          <ArrowLeft size={18} className="mr-2 shrink-0" /> Back to CHATTIX
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full">
          <div className="relative h-28 sm:h-36">
            <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            <button type="button" onClick={() => coverInputRef.current?.click()} className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-white/90 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-medium shadow">
              Change cover
            </button>
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4 -mt-10 sm:-mt-12">
            <div className="flex flex-col items-center">
              <div className="relative">
                <img src={avatarPreview} alt="" className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-chattix-primary text-white p-2 rounded-full shadow">
                  <Camera size={16} />
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full max-w-[12rem] mt-3">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-chattix-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-1">{uploadProgress}%</p>
                </div>
              )}
            </div>

            {['fullName', 'username'].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                <input name={field} value={formData[field]} onChange={handleChange} className="modern-input text-sm" required />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input value={user?.email || ''} disabled className="modern-input text-sm bg-gray-50 text-gray-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status message</label>
              <input name="statusMessage" value={formData.statusMessage} onChange={handleChange} maxLength={139} placeholder="Available" className="modern-input text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} maxLength={200} className="modern-input text-sm resize-none" />
            </div>

            <button type="submit" disabled={loading} className="button-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50">
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
