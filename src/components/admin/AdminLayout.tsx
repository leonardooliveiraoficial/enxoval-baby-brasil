import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <AuthGuard requireAdmin>
      <SidebarProvider defaultOpen={typeof window !== 'undefined' ? window.innerWidth >= 768 : false}>
        <div className="min-h-screen flex w-full bg-gray-50/30">
          <AdminSidebar />
          
          <div className="flex-1 flex flex-col min-w-0">
            <AdminHeader />
            
            <main className="flex-1 p-4 md:p-6">
              <div className="max-w-7xl mx-auto w-full">
                {children}
              </div>
            </main>
          </div>
        </div>
        <Toaster />
      </SidebarProvider>
    </AuthGuard>
  );
};