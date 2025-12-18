import { getSupabaseClient } from "../supabase/client";
import { OrgMember } from "../types";

const supabase = getSupabaseClient();

export async function fetchMembers() {
  const { data, error } = await supabase
    .from("org_members")
    .select("*")
    .order("display_name", { ascending: true });
  if (error) throw error;
  return (data || []) as OrgMember[];
}

export async function fetchCrewMembers() {
  const { data, error } = await supabase
    .from("org_members")
    .select("*")
    .eq("role", "crew_member")
    .order("display_name", { ascending: true });
  if (error) throw error;
  return (data || []) as OrgMember[];
}

export async function insertMember(payload: Partial<OrgMember>) {
  const { data, error } = await supabase
    .from("org_members")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as OrgMember;
}

export async function updateMember(id: string, payload: Partial<OrgMember>) {
  const { data, error } = await supabase
    .from("org_members")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as OrgMember;
}

export async function deleteMember(id: string) {
  const { error } = await supabase.from("org_members").delete().eq("id", id);
  if (error) throw error;
}
