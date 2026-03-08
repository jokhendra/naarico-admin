"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usersApi, User } from "@/lib/api/users-api";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

// Interface for form data
interface UserFormData {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  profileImage: string;
  dateOfBirth: string;
  bio: string;
}

export default function UserEditPage() {
  // Use the useParams hook to get the ID parameter from the URL
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    gender: '',
    profileImage: '',
    dateOfBirth: '',
    bio: ''
  });

  // Load user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await usersApi.getUserById(userId);
        setUser(userData);
        
        // Initialize form data with user data
        setFormData({
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone || '',
          gender: userData.gender || '',
          profileImage: userData.profileImage || '',
          dateOfBirth: userData.dateOfBirth ? formatDateForInput(userData.dateOfBirth) : '',
          bio: userData.bio || ''
        });
        
        setError(null);
      } catch (error: any) {
        console.error("Error fetching user:", error);
        setError(error.message || "Failed to load user details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [userId]);

  // Format date for display in input
  const formatDateForInput = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'yyyy-MM-dd');
    } catch (e) {
      return '';
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (value: string, field: keyof UserFormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const updatedUser = await usersApi.updateUser(userId, formData);
      setUser(updatedUser);
      toast.success("User updated successfully");
      
      // Navigate to user view page
      router.push(`/users/${userId}/view`);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p>Loading user details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <p className="text-destructive text-lg">Error: {error}</p>
          <Button onClick={() => router.push('/users')}>Back to Users</Button>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <p className="text-lg">User not found</p>
          <Button onClick={() => router.push('/users')}>Back to Users</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Link href={`/users/${userId}/view`} className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-3xl font-bold">Edit User</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                Update user details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={formData.firstName} 
                    onChange={handleInputChange}
                    placeholder="Enter first name" 
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={formData.lastName} 
                    onChange={handleInputChange}
                    placeholder="Enter last name" 
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={user.email} 
                    disabled 
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange}
                    placeholder="Enter phone number" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => handleSelectChange(value, 'gender')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input 
                    id="dateOfBirth" 
                    type="date" 
                    value={formData.dateOfBirth} 
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="profileImage">Profile Image URL</Label>
                  <Input 
                    id="profileImage" 
                    value={formData.profileImage} 
                    onChange={handleInputChange}
                    placeholder="https://example.com/profile.jpg" 
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    value={formData.bio} 
                    onChange={handleInputChange}
                    placeholder="Tell us about this user..." 
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push(`/users/${userId}/view`)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
} 