import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const PasswordChangeForm = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <form onSubmit={handleChangePassword} className="space-y-4">
      <div className="space-y-2">
        <Label>New Password</Label>
        <Input type="password" placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
      </div>
      <div className="space-y-2">
        <Label>Confirm Password</Label>
        <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
      </div>
      <Button type="submit" variant="gradient" disabled={saving || !newPassword || !confirmPassword}>
        {saving ? "Updating..." : "Update Password"}
      </Button>
    </form>
  );
};

const DashboardSettings = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const [displayName, setDisplayName] = useState("");
  const [notifyComplete, setNotifyComplete] = useState(true);
  const [notifyFailed, setNotifyFailed] = useState(true);
  const [notifyScheduleFail, setNotifyScheduleFail] = useState(true);
  const [notifEmail, setNotifEmail] = useState("");

  useEffect(() => {
    if (profile) {
      if (!displayName) setDisplayName(profile.display_name ?? "");
      setNotifyComplete((profile as any).notify_on_run_complete ?? true);
      setNotifyFailed((profile as any).notify_on_run_failed ?? true);
      setNotifyScheduleFail((profile as any).notify_on_schedule_fail ?? true);
      setNotifEmail((profile as any).notification_email ?? "");
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName || profile?.display_name } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveNotifications = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          notify_on_run_complete: notifyComplete,
          notify_on_run_failed: notifyFailed,
          notify_on_schedule_fail: notifyScheduleFail,
          notification_email: notifEmail || null,
        } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Notification preferences saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-lg font-medium">Settings</h1>

      <Card>
        <CardHeader><h2 className="text-sm font-medium text-muted-foreground">Profile</h2></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              placeholder={profile?.display_name ?? "Your name"}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <Button variant="gradient" onClick={() => updateProfile.mutate()}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="text-sm font-medium text-muted-foreground">Change Password</h2></CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h2 className="text-sm font-medium text-muted-foreground">Email Notifications</h2></CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Notifications go to <strong>{user?.email}</strong> unless you set a different email below.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Run completed</p>
                <p className="text-xs text-muted-foreground">Get emailed when an agent finishes with results</p>
              </div>
              <Switch checked={notifyComplete} onCheckedChange={setNotifyComplete} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Run failed</p>
                <p className="text-xs text-muted-foreground">Get emailed if an agent run fails</p>
              </div>
              <Switch checked={notifyFailed} onCheckedChange={setNotifyFailed} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Scheduled run paused</p>
                <p className="text-xs text-muted-foreground">Get emailed if a scheduled agent stops due to low credits</p>
              </div>
              <Switch checked={notifyScheduleFail} onCheckedChange={setNotifyScheduleFail} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Send notifications to a different email (optional)</Label>
            <Input
              type="email"
              placeholder="alternate@email.com"
              value={notifEmail}
              onChange={(e) => setNotifEmail(e.target.value)}
            />
          </div>
          <Button variant="gradient" onClick={() => saveNotifications.mutate()}>
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSettings;
