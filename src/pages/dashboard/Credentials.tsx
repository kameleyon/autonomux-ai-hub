import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, KeyRound, ShieldCheck } from "lucide-react";
import { encryptCredential } from "@/lib/credentials";

const CREDENTIAL_TYPES = [
  "OpenAI API Key",
  "Gmail App Password",
  "LinkedIn Cookie",
  "Stripe API Key",
  "Custom",
];

const Credentials = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newType, setNewType] = useState("");
  const [customType, setCustomType] = useState("");
  const [newValue, setNewValue] = useState("");
  const [open, setOpen] = useState(false);

  const { data: creds, isLoading } = useQuery({
    queryKey: ["credentials", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("user_credentials").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  // Get agents to show which use each credential type
  const { data: agents } = useQuery({
    queryKey: ["agents-credentials"],
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("name, required_credentials").eq("is_published", true);
      return data ?? [];
    },
  });

  const getAgentsForType = (credType: string) => {
    return (agents ?? [])
      .filter((a: any) => (a.required_credentials ?? []).some((c: string) =>
        c.toLowerCase().includes(credType.toLowerCase()) || credType.toLowerCase().includes(c.toLowerCase())
      ))
      .map((a: any) => a.name);
  };

  const effectiveType = newType === "Custom" ? customType : newType;

  const addCred = useMutation({
    mutationFn: async () => {
      const encrypted = await encryptCredential(newValue);
      const { error } = await supabase.from("user_credentials").insert({
        user_id: user!.id,
        credential_type: effectiveType,
        encrypted_value: encrypted,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credential added");
      setNewType(""); setCustomType(""); setNewValue(""); setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCred = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_credentials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credential deleted");
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium font-display">Credentials</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" size="sm"><Plus size={16} className="mr-2" />Add Credential</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Credential</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Credential Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger><SelectValue placeholder="Select a type…" /></SelectTrigger>
                  <SelectContent>
                    {CREDENTIAL_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newType === "Custom" && (
                  <Input
                    placeholder="Enter custom type name"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Value</Label>
                <Input type="password" placeholder="Enter credential value" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
              </div>
              <Button
                variant="gradient"
                className="w-full"
                disabled={!effectiveType || !newValue}
                onClick={() => addCred.mutate()}
              >
                Save Credential
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (creds ?? []).length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No credentials stored yet.</CardContent></Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Used By</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(creds ?? []).map((cred) => {
                const usedBy = getAgentsForType(cred.credential_type);
                return (
                  <TableRow key={cred.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <KeyRound size={14} className="text-muted-foreground" />
                      {cred.credential_type}
                    </TableCell>
                    <TableCell className="text-muted-foreground">••••••••</TableCell>
                    <TableCell>
                      {usedBy.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {usedBy.slice(0, 3).map((name) => (
                            <Badge key={name} variant="outline" className="text-xs font-normal">{name}</Badge>
                          ))}
                          {usedBy.length > 3 && (
                            <Badge variant="outline" className="text-xs font-normal">+{usedBy.length - 3}</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(cred.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="Test credential (coming soon)" disabled>
                        <ShieldCheck size={16} className="text-muted-foreground" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 size={16} className="text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Credential</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete this credential. Agents using it will stop working.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCred.mutate(cred.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default Credentials;
