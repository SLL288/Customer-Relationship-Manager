import { getSupabaseClient } from "../supabase/client";
import { Team, TeamMember } from "../types";

const supabase = getSupabaseClient();

export async function fetchTeams() {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as Team[];
}

export async function insertTeam(payload: Partial<Team>) {
  const { data, error } = await supabase
    .from("teams")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Team;
}

export async function updateTeam(id: string, payload: Partial<Team>) {
  const { data, error } = await supabase
    .from("teams")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Team;
}

export async function deleteTeam(id: string) {
  const { error } = await supabase.from("teams").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchTeamMembers(teamId: string) {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId);
  if (error) throw error;
  return (data || []) as TeamMember[];
}
