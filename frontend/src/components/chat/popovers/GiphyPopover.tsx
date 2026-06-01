import React from 'react';
import { Popover } from '@headlessui/react';
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';

const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY as string);

interface GiphyPopoverProps {
    onGifSelect: (gifUrl: string) => void;
    children: React.ReactNode;
}

const GiphyPopover: React.FC<GiphyPopoverProps> = ({ onGifSelect, children }) => {
    const fetchGifs = (offset: number) => gf.trending({ offset, limit: 10 });

    return (
        <Popover className="relative">
            <Popover.Button as="div" className="cursor-pointer focus:outline-none">
                {children}
            </Popover.Button>

            <Popover.Panel className="absolute bottom-full mb-2 right-0 z-50 w-80 h-96 bg-[var(--color-bg-dark-secondary)] rounded-xl shadow-xl overflow-y-auto border border-[var(--color-border-dark)] p-2">
                <Grid
                    width={300}
                    columns={2}
                    fetchGifs={fetchGifs}
                    onGifClick={(gif, e) => {
                        e.preventDefault();
                        onGifSelect(gif.images.original.url);
                    }}
                />
            </Popover.Panel>
        </Popover>
    );
};

export default GiphyPopover;