import { getSupabaseClient } from "../supabase/client";
import { TeamMember } from "../types";

const supabase = getSupabaseClient();

export async function addTeamMembers(teamId: string, userIds: string[]) {
  if (!userIds.length) return [];
  const rows = userIds.map((userId) => ({ team_id: teamId, user_id: userId }));
  const { data, error } = await supabase
    .from("team_members")
    .insert(rows)
    .select();
  if (error) throw error;
  return data as TeamMember[];
}

export async function removeTeamMember(teamMemberId: string) {
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", teamMemberId);
  if (error) throw error;
}

export async function replaceTeamMembers(teamId: string, userIds: string[]) {
  const { error: delErr } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId);
  if (delErr) throw delErr;
  return addTeamMembers(teamId, userIds);
}
