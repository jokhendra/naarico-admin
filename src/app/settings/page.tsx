"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSavePreferences() {
    setIsLoading(true);
    // Simulating an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaved(true);
    setIsLoading(false);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {isSaved && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 text-green-800 dark:text-green-300 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">Settings saved successfully!</span>
        </div>
      )}

      <div className="space-y-8">
        <div className="border rounded-md p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3">
              <div>
                <Label htmlFor="email-notifications">Email notifications</Label>
                <p className="text-sm text-muted-foreground">Receive emails about your account activity</p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketing-emails">Marketing emails</Label>
                <p className="text-sm text-muted-foreground">Receive emails about new products and features</p>
              </div>
              <Switch 
                id="marketing-emails" 
                checked={marketingEmails}
                onCheckedChange={setMarketingEmails}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleSavePreferences}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 