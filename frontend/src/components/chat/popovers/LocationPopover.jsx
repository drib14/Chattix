import { useState } from 'react';
import { Popover } from '@headlessui/react';
import axios from 'axios';
import toast from 'react-hot-toast';

const LocationPopover = ({ onLocationShare, children }) => {
    const [loading, setLoading] = useState(false);

    const handleShareLocation = () => {
        setLoading(true);
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const res = await axios.get(`https://us1.locationiq.com/v1/reverse.php?key=${import.meta.env.VITE_LOCATIONIQ_ACCESS_TOKEN}&lat=${latitude}&lon=${longitude}&format=json`);
                    const address = res.data.display_name;

                    onLocationShare({ lat: latitude, lng: longitude, address });
                    toast.success('Location Shared!');
                } catch (error) {
                    toast.error('Could not fetch address, sharing raw coordinates.');
                     onLocationShare({ lat: latitude, lng: longitude, address: 'Unknown Location' });
                } finally {
                    setLoading(false);
                }
            },
            () => {
                toast.error('Unable to retrieve your location');
                setLoading(false);
            }
        );
    };

    return (
        <Popover className="relative">
            <Popover.Button as="div" className="cursor-pointer focus:outline-none">
                {children}
            </Popover.Button>

            <Popover.Panel className="absolute bottom-full mb-2 right-0 z-50 w-64 bg-[var(--color-bg-dark-secondary)] rounded-xl shadow-xl border border-[var(--color-border-dark)] p-4 text-center">
                <p className="text-white mb-4 text-sm">Share your current location?</p>
                <button
                    onClick={handleShareLocation}
                    disabled={loading}
                    className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50"
                >
                    {loading ? 'Locating...' : 'Share Location'}
                </button>
            </Popover.Panel>
        </Popover>
    );
};

export default LocationPopover;
