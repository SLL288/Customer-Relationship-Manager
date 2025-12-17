import { getSupabaseClient } from "../supabase/client";
import { EventAssignment } from "../types";

const supabase = getSupabaseClient();

export async function fetchAssignmentsForEvent(eventId: string) {
  const { data, error } = await supabase
    .from("event_assignments")
    .select("*")
    .eq("event_id", eventId);
  if (error) throw error;
  return (data || []) as EventAssignment[];
}

export async function replaceAssignments(eventId: string, userIds: string[]) {
  const { error: deleteError } = await supabase
    .from("event_assignments")
    .delete()
    .eq("event_id", eventId);
  if (deleteError) throw deleteError;

  if (!userIds.length) return [];

  const rows = userIds.map((userId) => ({
    event_id: eventId,
    user_id: userId,
  }));

  const { data, error } = await supabase
    .from("event_assignments")
    .insert(rows)
    .select();
  if (error) throw error;
  return data as EventAssignment[];
}
