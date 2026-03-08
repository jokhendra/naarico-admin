"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@/types/user";

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  // Update form when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user, form]);

  async function onSubmit(values: ProfileFormValues) {
    try {
      setIsLoading(true);
      setIsSaved(false);
      setError(null);
      
      const success = await updateProfile({
        name: values.name,
      });
      
      if (success) {
        setIsSaved(true);
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      setError("An error occurred while updating your profile.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information and personal details
        </p>
      </div>

      {isSaved && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 text-green-800 dark:text-green-300 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">Profile updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="border rounded-md p-6 bg-card">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input disabled type="email" {...field} />
                  </FormControl>
                  <p className="text-sm text-muted-foreground mt-1">Email cannot be changed</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div className="mt-8 border rounded-md p-6 bg-card">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground">User ID</span>
            <span>{user.id}</span>
          </div>
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-muted-foreground">Role</span>
            <span className="capitalize">{user.role}</span>
          </div>
          {user.createdAt && (
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Member Since</span>
              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          {user.updatedAt && (
            <div className="flex items-center justify-between pb-2">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{new Date(user.updatedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 