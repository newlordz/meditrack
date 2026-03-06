import { Outlet } from 'react-router-dom';
import Sidebar, { MobileNav, MobileHeader } from '../components/Sidebar';

export default function DashboardLayout() {
    return (
        <div className="min-h-screen bg-background relative pb-20 pt-16 lg:pb-0 lg:pt-0">
            <MobileHeader />
            <Sidebar />
            <div className="sidebar-offset">
                <main className="min-h-screen">
                    <Outlet />
                </main>
            </div>
            <MobileNav />
        </div>
    );
}
