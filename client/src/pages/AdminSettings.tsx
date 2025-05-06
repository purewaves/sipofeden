import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import { useToast } from '../components/ui/use-toast';
import { Check, Loader2 } from 'lucide-react';

const AdminSettings = () => {
  const { toast } = useToast();
  
  // Fetch website settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    onSuccess: (data) => {
      if (data) {
        setWebsiteSettings(data);
      }
    },
  });

  const [websiteSettings, setWebsiteSettings] = useState({
    siteName: '',
    logoUrl: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    aboutUs: '',
    openingHours: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
    },
    enableLoyaltyProgram: false,
    enableOnlineOrdering: true,
    maintenanceMode: false,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Update website settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data) => apiRequest('PUT', '/api/settings', data),
    onSuccess: () => {
      toast({
        title: 'Settings updated',
        description: 'Website settings have been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update settings: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: (data) => apiRequest('PUT', '/api/admin/password', data),
    onSuccess: () => {
      toast({
        title: 'Password updated',
        description: 'Your password has been updated successfully.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update password: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleSettingsChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setWebsiteSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setWebsiteSettings(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmitSettings = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate(websiteSettings);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    
    updatePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>

      <Tabs defaultValue="website" className="space-y-4">
        <TabsList>
          <TabsTrigger value="website">Website Settings</TabsTrigger>
          <TabsTrigger value="account">Account Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="website" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Manage your website's general information and appearance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Website Name</Label>
                    <Input
                      id="siteName"
                      value={websiteSettings.siteName}
                      onChange={(e) => handleSettingsChange('siteName', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      value={websiteSettings.logoUrl}
                      onChange={(e) => handleSettingsChange('logoUrl', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="aboutUs">About Us</Label>
                  <Textarea
                    id="aboutUs"
                    value={websiteSettings.aboutUs}
                    onChange={(e) => handleSettingsChange('aboutUs', e.target.value)}
                    rows={4}
                  />
                </div>

                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={websiteSettings.contactEmail}
                        onChange={(e) => handleSettingsChange('contactEmail', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input
                        id="contactPhone"
                        value={websiteSettings.contactPhone}
                        onChange={(e) => handleSettingsChange('contactPhone', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={websiteSettings.address}
                      onChange={(e) => handleSettingsChange('address', e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="openingHours">Opening Hours</Label>
                    <Textarea
                      id="openingHours"
                      value={websiteSettings.openingHours}
                      onChange={(e) => handleSettingsChange('openingHours', e.target.value)}
                      rows={2}
                      placeholder="e.g. Mon-Fri: 9am - 5pm, Sat-Sun: 10am - 3pm"
                    />
                  </div>
                </div>

                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Social Media</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        value={websiteSettings.socialLinks?.facebook || ''}
                        onChange={(e) => handleSettingsChange('socialLinks.facebook', e.target.value)}
                        placeholder="https://facebook.com/sipofeden"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={websiteSettings.socialLinks?.instagram || ''}
                        onChange={(e) => handleSettingsChange('socialLinks.instagram', e.target.value)}
                        placeholder="https://instagram.com/sipofeden"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input
                        id="twitter"
                        value={websiteSettings.socialLinks?.twitter || ''}
                        onChange={(e) => handleSettingsChange('socialLinks.twitter', e.target.value)}
                        placeholder="https://twitter.com/sipofeden"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Features</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableLoyaltyProgram" className="text-base">Loyalty Program</Label>
                        <p className="text-sm text-gray-500">Enable customer loyalty program with points and rewards</p>
                      </div>
                      <Switch
                        id="enableLoyaltyProgram"
                        checked={websiteSettings.enableLoyaltyProgram}
                        onCheckedChange={(checked) => handleSettingsChange('enableLoyaltyProgram', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableOnlineOrdering" className="text-base">Online Ordering</Label>
                        <p className="text-sm text-gray-500">Allow customers to place orders through the website</p>
                      </div>
                      <Switch
                        id="enableOnlineOrdering"
                        checked={websiteSettings.enableOnlineOrdering}
                        onCheckedChange={(checked) => handleSettingsChange('enableOnlineOrdering', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="maintenanceMode" className="text-base">Maintenance Mode</Label>
                        <p className="text-sm text-gray-500">Temporarily disable the website for maintenance</p>
                      </div>
                      <Switch
                        id="maintenanceMode"
                        checked={websiteSettings.maintenanceMode}
                        onCheckedChange={(checked) => handleSettingsChange('maintenanceMode', checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Update your account settings and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={updatePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                    >
                      {updatePasswordMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings; 