import { useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const ImageUploadPopover = ({ onImageUpload, children }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'chattix');

        try {
             const res = await axios.post(
                `https://api.cloudinary.com/v1_1/dwquuisuj/image/upload`,
                formData
            );
            onImageUpload(res.data.secure_url);
        } catch (error) {
            toast.error('Image upload failed. Note: Requires "chattix" unsigned upload preset in Cloudinary.');
            console.error(error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <>
            <div onClick={handleClick} className={`cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {children}
            </div>
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
        </>
    );
};

export default ImageUploadPopover;
