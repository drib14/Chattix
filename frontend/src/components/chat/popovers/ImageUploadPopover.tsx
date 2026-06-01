import React, { useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ImageUploadProps {
    onImageUpload: (imageUrl: string) => void;
    children: React.ReactNode;
}

const ImageUploadPopover: React.FC<ImageUploadProps> = ({ onImageUpload, children }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Ensure it's an image
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'chattix'); // Replace with your cloudinary preset if using unauthenticated uploads, or we upload via backend.

        // For this clone, we will upload to Cloudinary via their REST API directly from frontend for simplicity if we want, OR we can use our backend.
        // Given we have Cloudinary setup on backend, let's just use the direct API here for simplicity if allowed, but we don't have an upload route in backend yet.
        // Let's implement direct Cloudinary upload using the API Key and Cloud Name from env.

        try {
            // Since we didn't build a backend endpoint for uploading images to cloudinary yet, we can do it directly.
            // Using formData and cloudinary URL. Note: requires an 'unsigned' upload preset configured in Cloudinary.
            // Assuming the user will configure 'chattix' as unsigned preset. If not, it will fail.
            // A more robust way is to send the file to backend. Let's assume we do the frontend way for now.
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