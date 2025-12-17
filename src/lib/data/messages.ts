import { getSupabaseClient } from "../supabase/client";
import { SmsMessage } from "../types";

const supabase = getSupabaseClient();

export async function fetchMessages() {
  const { data, error } = await supabase
    .from("sms_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as SmsMessage[];
}
