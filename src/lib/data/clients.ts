import { getSupabaseClient } from "../supabase/client";
import { Client, Project } from "../types";

const supabase = getSupabaseClient();

export async function fetchClients(search?: string) {
  let query = supabase.from("clients").select("*").order("created_at", {
    ascending: false,
  });
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
    );
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Client[];
}

export async function insertClient(payload: Partial<Client>) {
  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Client;
}

export async function updateClient(id: string, payload: Partial<Client>) {
  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Client;
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchProjectsForClient(clientId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Project[];
}
