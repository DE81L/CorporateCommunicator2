import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ElectronInfo from "@/components/electron-info";
import { useElectron } from "@/hooks/use-electron";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export default function SettingsSection() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { isElectron } = useElectron();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [soundNotifications, setSoundNotifications] = useState(false);

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (data: PasswordChangeFormValues) => {
    // In real implementation, this would call an API endpoint
    toast({
      title: "Password updated",
      description: "Your password has been updated successfully.",
    });
    setIsPasswordDialogOpen(false);
    form.reset();
  };

  if (!user) return null;

  return (
    <div className="flex-1 overflow-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Settings</h2>

      {/* Account Settings */}
      <Card className="mb-6">
        <CardHeader className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <CardTitle className="text-base font-medium">
            Account Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="font-medium">Profile Information</h4>
              <p className="text-sm text-gray-500">
                Update your name, title, and profile photo
              </p>
            </div>
            <Button variant="ghost">Edit</Button>
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="font-medium">Email Address</h4>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <Button variant="ghost">Change</Button>
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="font-medium">Password</h4>
              <p className="text-sm text-gray-500">Update your password</p>
            </div>
            <Dialog
              open={isPasswordDialogOpen}
              onOpenChange={setIsPasswordDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="ghost">Update</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and a new password to update
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter current password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter new password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm new password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsPasswordDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Update Password</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mb-6">
        <CardHeader className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <CardTitle className="text-base font-medium">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-gray-500">
                Receive email notifications for messages and announcements
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="font-medium">Desktop Notifications</h4>
              <p className="text-sm text-gray-500">
                Receive desktop notifications for messages and calls
              </p>
            </div>
            <Switch
              checked={desktopNotifications}
              onCheckedChange={setDesktopNotifications}
            />
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="font-medium">Sound Notifications</h4>
              <p className="text-sm text-gray-500">
                Play sound for new messages and calls
              </p>
            </div>
            <Switch
              checked={soundNotifications}
              onCheckedChange={setSoundNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="mb-6">
        <CardHeader className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <CardTitle className="text-base font-medium">
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100">
          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="font-medium">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-500">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="ghost">Enable</Button>
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="font-medium">Session Management</h4>
              <p className="text-sm text-gray-500">
                View and manage your active sessions
              </p>
            </div>
            <Button variant="ghost">View</Button>
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="font-medium">Data Privacy</h4>
              <p className="text-sm text-gray-500">
                Manage your data and privacy settings
              </p>
            </div>
            <Button variant="ghost">Manage</Button>
          </div>

          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="font-medium">Sign Out</h4>
              <p className="text-sm text-gray-500">
                Sign out from your account
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Desktop App Information - Only show in Electron mode */}
      {isElectron && <ElectronInfo />}
    </div>
  );
}
