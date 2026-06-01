import React from 'react';
import { Popover } from '@headlessui/react';
import Picker, { Theme } from 'emoji-picker-react';

interface EmojiPopoverProps {
    onEmojiSelect: (emoji: string) => void;
    children: React.ReactNode;
}

const EmojiPopover: React.FC<EmojiPopoverProps> = ({ onEmojiSelect, children }) => {
    return (
        <Popover className="relative">
            <Popover.Button as="div" className="cursor-pointer focus:outline-none">
                {children}
            </Popover.Button>

            <Popover.Panel className="absolute bottom-full mb-2 right-0 z-50 shadow-xl">
                 <Picker
                    onEmojiClick={(emojiData) => onEmojiSelect(emojiData.emoji)}
                    theme={Theme.DARK}
                 />
            </Popover.Panel>
        </Popover>
    );
};

export default EmojiPopover;