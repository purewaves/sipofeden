import React from 'react';
import AdminLayout from './AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';

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
          {title && (
            <h1 className="font-heading text-2xl font-semibold mb-6">{title}</h1>
          )}
          
          {children}
        </main>
      </div>
    </AdminLayout>
  );
};

export default AdminPageWrapper;