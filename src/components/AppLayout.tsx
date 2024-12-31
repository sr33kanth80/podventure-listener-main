import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-white">
      <AppSidebar />
      <main className="ml-64">
        <Outlet />
      </main>
    </div>
  );
} 