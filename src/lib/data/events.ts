import { getSupabaseClient } from "../supabase/client";
import { Event, EventWithProject } from "../types";

const supabase = getSupabaseClient();

export async function fetchEventsInRange(
  startIso: string,
  endIso: string,
  teamId?: string,
) {
  let query = supabase
    .from("events")
    .select("*, project:projects(*)")
    .gte("start_time", startIso)
    .lte("end_time", endIso);
  if (teamId) {
    query = query.eq("team_id", teamId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as EventWithProject[];
}

export async function insertEvent(payload: Partial<Event>) {
  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Event;
}

export async function updateEvent(id: string, payload: Partial<Event>) {
  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Event;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function confirmAndNotify(eventId: string) {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const token = sessionData.session?.access_token;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!token || !supabaseUrl) {
    throw new Error("Missing Supabase session or URL");
  }

  const { error } = await supabase
    .from("events")
    .update({ status: "confirmed" })
    .eq("id", eventId);
  if (error) throw error;

  const res = await fetch(
    `${supabaseUrl}/functions/v1/send-schedule-sms`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event_id: eventId }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      text || "Edge function call failed. Is send-schedule-sms deployed?",
    );
  }

  return true;
}
