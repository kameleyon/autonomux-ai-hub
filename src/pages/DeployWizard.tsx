import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import confetti from "canvas-confetti";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, ArrowLeft, ArrowRight, Lock, Shield } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { encryptCredential } from "@/lib/credentials";

const TEXTAREA_FIELDS = ["email_content", "input_text", "knowledge_base", "code", "transcript", "rules"];

const DeployWizard = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const { data: agent, isLoading } = useQuery({
    queryKey: ["deploy-agent", agentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId!)
        .single();
      return data;
    },
    enabled: !!agentId,
  });

  useEffect(() => {
    if (deployed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E81E25", "#F7941D", "#10B981"],
      });
    }
  }, [deployed]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Agent not found.</p>
      </div>
    );
  }

  const schema = agent.config_schema as { fields?: Array<{ name: string; type: string; options?: string[]; default?: string | number }> } | null;
  const fields = schema?.fields ?? [];
  const requiredCreds = agent.required_credentials ?? [];

  const handleDeploy = async () => {
    if (!user) return;
    setDeploying(true);

    try {
      // Encrypt and save credentials (upsert to avoid duplicates)
      for (const [type, value] of Object.entries(credentials)) {
        if (value) {
          const encrypted = await encryptCredential(value);

          const { data: existing } = await supabase
            .from("user_credentials")
            .select("id")
            .eq("user_id", user.id)
            .eq("credential_type", type)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("user_credentials")
              .update({ encrypted_value: encrypted })
              .eq("id", existing.id);
          } else {
            await supabase.from("user_credentials").insert({
              user_id: user.id,
              credential_type: type,
              encrypted_value: encrypted,
            });
          }
        }
      }

      // Create deployment
      const { data: deployment, error } = await supabase.from("deployments").insert({
        user_id: user.id,
        agent_id: agent.id,
        config,
        status: "active",
      }).select().single();

      if (error) {
        toast.error("Failed to deploy: " + error.message);
        setDeploying(false);
        return;
      }

      // Trigger first run
      try {
        await supabase.functions.invoke("run-agent", {
          body: { deployment_id: deployment.id },
        });
        toast.success("Agent deployed and first run started!");
      } catch {
        toast.success("Agent deployed! First run will start shortly.");
      }

      setDeploying(false);
      setDeployed(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Encryption failed: " + message);
      setDeploying(false);
    }
  };

  if (deployed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
            <CheckCircle size={40} />
          </div>
          <h1 className="text-3xl font-medium font-display">Your Agent is Live and Running!</h1>
          <p className="text-muted-foreground">{agent.name} is now deployed and running.</p>
          <div className="flex justify-center gap-4">
            <Button variant="gradient" asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/runs">View Run History →</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/marketplace">Deploy Another</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-2xl font-medium font-display mb-2">Deploy {agent.name}</h1>
        <p className="text-muted-foreground mb-8">{agent.base_credit_cost} credits per run</p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                step >= s
                  ? "bg-gradient-to-br from-primary to-accent text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {s}
              </div>
              <span className={`text-xs hidden sm:inline ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                {s === 1 ? "Configure" : s === 2 ? "Credentials" : "Review"}
              </span>
              {s < 3 && <div className={`flex-1 h-px ${step > s ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Configure */}
        {step === 1 && (
          <Card>
            <CardHeader><h2 className="font-medium text-lg">Configuration</h2></CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No configuration needed for this agent.</p>
              ) : (
                fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label>{field.name.replace(/_/g, " ")}</Label>
                    {field.type === "select" && field.options ? (
                      <Select
                        value={config[field.name] ?? String(field.default ?? "")}
                        onValueChange={(v) => setConfig({ ...config, [field.name]: v })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {field.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : TEXTAREA_FIELDS.includes(field.name) ? (
                      <Textarea
                        placeholder={String(field.default ?? "")}
                        value={config[field.name] ?? ""}
                        onChange={(e) => setConfig({ ...config, [field.name]: e.target.value })}
                        className="min-h-[120px]"
                      />
                    ) : (
                      <Input
                        placeholder={String(field.default ?? "")}
                        value={config[field.name] ?? ""}
                        onChange={(e) => setConfig({ ...config, [field.name]: e.target.value })}
                      />
                    )}
                  </div>
                ))
              )}
              <div className="flex justify-end pt-4">
                <Button variant="gradient" onClick={() => setStep(2)}>
                  Next <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Credentials */}
        {step === 2 && (
          <Card>
            <CardHeader><h2 className="font-medium text-lg">Connect Credentials</h2></CardHeader>
            <CardContent className="space-y-4">
              {requiredCreds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No credentials required for this agent.</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
                    <Shield size={16} className="text-accent shrink-0" />
                    <span className="text-muted-foreground">Your credentials are encrypted and stored securely.</span>
                  </div>
                  {requiredCreds.map((cred) => (
                    <div key={cred} className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Lock size={14} /> {cred.replace(/_/g, " ")}
                      </Label>
                      <Input
                        type="password"
                        placeholder="Enter credential..."
                        value={credentials[cred] ?? ""}
                        onChange={(e) => setCredentials({ ...credentials, [cred]: e.target.value })}
                      />
                      <a
                        href={`https://www.google.com/search?q=how+to+get+${encodeURIComponent(cred.replace(/_/g, " "))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline"
                      >
                        How to get this →
                      </a>
                    </div>
                  ))}
                </>
              )}
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} className="mr-2" /> Back
                </Button>
                <Button variant="gradient" onClick={() => setStep(3)}>
                  Next <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card>
            <CardHeader><h2 className="font-medium text-lg">Review & Deploy</h2></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Agent</span>
                  <span className="font-medium">{agent.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost</span>
                  <Badge variant="accent">{agent.base_credit_cost} credits/run</Badge>
                </div>
                {Object.entries(config).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{k.replace(/_/g, " ")}</span>
                    <span>{v}</span>
                  </div>
                ))}
                {requiredCreds.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Credentials</span>
                    <span>{requiredCreds.length} configured</span>
                  </div>
                )}
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
                <span className="text-sm text-muted-foreground">
                  I agree to the terms of service and understand that credits will be deducted for each run.
                </span>
              </label>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft size={16} className="mr-2" /> Back
                </Button>
                <Button variant="gradient" disabled={!agreed || deploying} onClick={handleDeploy}>
                  {deploying ? "Deploying..." : "Deploy Agent"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DeployWizard;
