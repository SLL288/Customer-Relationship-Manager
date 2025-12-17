import { getSupabaseClient } from "../supabase/client";
import { Event, Project } from "../types";

const supabase = getSupabaseClient();

export async function fetchProjects(status?: string) {
  let query = supabase.from("projects").select("*").order("created_at", {
    ascending: false,
  });
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Project[];
}

export async function insertProject(payload: Partial<Project>) {
  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

export async function updateProject(id: string, payload: Partial<Project>) {
  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchEventsForProject(projectId: string) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("project_id", projectId)
    .order("start_time", { ascending: true });
  if (error) throw error;
  return (data || []) as Event[];
}
