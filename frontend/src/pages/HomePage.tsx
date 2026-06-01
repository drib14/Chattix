import LeftSidebar from '../components/layout/LeftSidebar';
import MainChat from '../components/layout/MainChat';
import RightSidebar from '../components/layout/RightSidebar';

const HomePage = () => {
    return (
        <div className="flex w-full h-full text-white bg-[var(--color-bg-dark)]">
           <LeftSidebar />
           <MainChat />
           <RightSidebar />
        </div>
    );
};

export default HomePage;