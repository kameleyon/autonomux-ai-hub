import { supabase } from "@/integrations/supabase/client";

export async function encryptCredential(value: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("encrypt-credential", {
    body: { value },
  });

  if (error) throw new Error(error.message || "Encryption failed");
  if (!data?.encrypted) throw new Error("Encryption returned no data");

  return data.encrypted;
}
