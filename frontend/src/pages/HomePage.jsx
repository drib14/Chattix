import { useState } from 'react';
import NavSidebar from '../components/layout/NavSidebar';
import LeftSidebar from '../components/layout/LeftSidebar';
import MainChat from '../components/layout/MainChat';
import RightSidebar from '../components/layout/RightSidebar';

const HomePage = () => {
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'people'

    return (
        <div className="flex w-full h-full text-white bg-[#0e0f14] overflow-hidden">
            {/* Narrow far-left sidebar */}
            <NavSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            
            {/* Chats list or People list primary sidebar */}
            <LeftSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            
            {/* Central chat interface */}
            <MainChat />
            
            {/* Right details sidebar (collapsible on smaller viewports) */}
            <RightSidebar />
        </div>
    );
};

export default HomePage;
