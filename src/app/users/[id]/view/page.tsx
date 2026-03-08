"use client";

import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usersApi, User } from "@/lib/api/users-api";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function UserViewPage() {
  // Use the useParams hook to get the ID parameter from the URL
  const params = useParams();
  const userId = params.id as string;
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await usersApi.getUserById(userId);
        setUser(userData);
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

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format datetime for display
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/users" className="rounded-full w-8 h-8 flex items-center justify-center bg-muted hover:bg-muted/80">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold">User Details</h1>
          </div>
          <Link href={`/users/${userId}`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </Button>
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4 overflow-hidden">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
                ) : (
                  <UserRound className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <h2 className="text-xl font-bold">{user.firstName} {user.lastName}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex gap-2">
                <Badge variant={user.status === "ACTIVE" ? "secondary" : "destructive"} className={user.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : ""}>
                  {user.status}
                </Badge>
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Detailed user profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p>{user.email}</p>
                  <span className={`text-xs ${user.isEmailVerified ? 'text-green-600' : 'text-amber-600'}`}>
                    {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                  <p>{user.phone || 'Not provided'}</p>
                  {user.phone && (
                    <span className={`text-xs ${user.isPhoneVerified ? 'text-green-600' : 'text-amber-600'}`}>
                      {user.isPhoneVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Gender</h3>
                  <p>{user.gender || 'Not specified'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Date of Birth</h3>
                  <p>{user.dateOfBirth ? formatDate(user.dateOfBirth) : 'Not provided'}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Bio</h3>
                  <p className="whitespace-pre-wrap">{user.bio || 'No bio provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                User account details and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Account Status</h3>
                  <Badge variant={user.status === "ACTIVE" ? "secondary" : "destructive"} className={`mt-1 ${user.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : ""}`}>
                    {user.status}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="mt-1">
                    {user.role}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Joined On</h3>
                  <p>{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Last Login</h3>
                  <p>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 