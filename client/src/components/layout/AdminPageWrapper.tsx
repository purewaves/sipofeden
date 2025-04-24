import React from 'react';
import AdminLayout from './AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import ManualPwaInstallButton from '@/components/admin/ManualPwaInstallButton';

interface AdminPageWrapperProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * A wrapper component for all admin pages to ensure consistent layout and styling
 * This component applies the AdminLayout wrapper and includes the AdminHeader
 */
const AdminPageWrapper: React.FC<AdminPageWrapperProps> = ({ 
  children, 
  title 
}) => {
  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-100">
        <AdminHeader />
        
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            {title && (
              <h1 className="font-heading text-2xl font-semibold">{title}</h1>
            )}
            <div className="ml-auto">
              <ManualPwaInstallButton />
            </div>
          </div>
          
          {children}
        </main>
      </div>
    </AdminLayout>
  );
};

export default AdminPageWrapper;