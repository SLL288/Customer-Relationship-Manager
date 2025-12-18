"use client";

import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import { DateSelectArg, EventClickArg, EventDropArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import toast from "react-hot-toast";
import { Modal } from "../../../components/Modal";
import {
  confirmAndNotify,
  deleteEvent,
  fetchEventsInRange,
  insertEvent,
  updateEvent,
} from "../../../lib/data/events";
import { fetchProjects } from "../../../lib/data/projects";
import { fetchMembers } from "../../../lib/data/members";
import { fetchAssignmentsForEvent, replaceAssignments } from "../../../lib/data/assignments";
import { fetchTeams, fetchTeamMembers } from "../../../lib/data/teams";
import { Event as DbEvent, EventWithProject, OrgMember, Project, Team, TeamMember } from "../../../lib/types";
import { Trash2, CheckCircle2 } from "lucide-react";

type EventForm = Partial<DbEvent> & { id?: string };

export default function CalendarPage() {
  const [events, setEvents] = useState<EventWithProject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<EventForm>({});
  const [saving, setSaving] = useState(false);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>(
    [],
  );
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const teamById = useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach((team) => map.set(team.id, team));
    return map;
  }, [teams]);

  const calendarEvents = useMemo(
    () =>
      events.map((evt) => {
        const teamColor = evt.team_id ? teamById.get(evt.team_id)?.color : null;
        const confirmed = evt.status === "confirmed";
        return {
          id: evt.id,
          title: evt.project?.title || "Untitled",
          start: evt.start_time,
          end: evt.end_time,
          backgroundColor: teamColor || (confirmed ? "#22c55e" : undefined),
          borderColor: teamColor || (confirmed ? "#16a34a" : undefined),
          extendedProps: evt,
        };
      }),
    [events, teamById],
  );

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [projectData, memberData, teamData] = await Promise.all([
          fetchProjects("all"),
          fetchMembers(),
          fetchTeams(),
        ]);
        setProjects(projectData);
        setOrgMembers(memberData);
        setTeams(teamData);
      } catch (err: any) {
        toast.error(err.message || "Failed to load reference data");
      }
    };
    loadLookups();
  }, []);

  useEffect(() => {
    const loadTeamMembers = async () => {
      const teamId = form.team_id || currentTeamId;
      if (!teamId) {
        setTeamMembers([]);
        return;
      }
      try {
        const members = await fetchTeamMembers(teamId);
        setTeamMembers(members);
        setSelectedAssignmentIds((prev) =>
          prev.filter((id) => members.some((m) => m.user_id === id)),
        );
      } catch (err: any) {
        toast.error(err.message || "Failed to load team members");
      }
    };
    loadTeamMembers();
  }, [form.team_id, currentTeamId]);

  const crewOptions = useMemo(() => {
    if (teamMembers.length === 0) return [];
    return teamMembers
      .map((tm) => orgMembers.find((m) => m.user_id === tm.user_id))
      .filter((m): m is OrgMember => Boolean(m));
  }, [teamMembers, orgMembers]);

  const loadEvents = async (
    startIso: string,
    endIso: string,
    teamOverride?: string | null,
  ) => {
    setLoading(true);
    try {
      const data = await fetchEventsInRange(
        startIso,
        endIso,
        (teamOverride ?? currentTeamId) || undefined,
      );
      setEvents(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (selectInfo: DateSelectArg) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setForm({
      start_time: selectInfo.startStr,
      end_time: selectInfo.endStr,
      timezone,
      status: "scheduled",
      notes: "",
      project_id: projects[0]?.id || null,
      team_id: currentTeamId,
    });
    setSelectedAssignmentIds([]);
    setModalOpen(true);
  };

  const handleEventClick = async (clickInfo: EventClickArg) => {
    const evt = clickInfo.event.extendedProps as EventWithProject;
    setForm({ ...evt, team_id: evt.team_id || currentTeamId });
    try {
      const assignments = await fetchAssignmentsForEvent(evt.id);
      setSelectedAssignmentIds(assignments.map((a) => a.user_id));
    } catch (err: any) {
      toast.error(err.message || "Failed to load assignments");
      setSelectedAssignmentIds([]);
    }
    setModalOpen(true);
  };

  const handleEventDrop = async (arg: EventDropArg) => {
    try {
      await updateEvent(arg.event.id, {
        start_time: arg.event.start?.toISOString(),
        end_time: arg.event.end?.toISOString(),
      });
      toast.success("Event rescheduled");
      if (rangeStart && rangeEnd) {
        await loadEvents(rangeStart, rangeEnd);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reschedule");
      arg.revert();
    }
  };

  const resetForm = () => {
    setModalOpen(false);
    setForm({});
    setSelectedAssignmentIds([]);
  };

  const handleSave = async () => {
    const resolvedTeamId = form.team_id || currentTeamId || null;
    if (!form.project_id || !form.start_time || !form.end_time || !resolvedTeamId) {
      toast.error("Team, project, start, and end are required");
      return;
    }
    const startIso = new Date(form.start_time).toISOString();
    const endIso = new Date(form.end_time).toISOString();
    setSaving(true);
    try {
      const payload = {
        project_id: form.project_id,
        team_id: resolvedTeamId,
        status: form.status ?? "scheduled",
        notes: form.notes ?? "",
        start_time: startIso,
        end_time: endIso,
        timezone:
          form.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      let saved: DbEvent;
      if (form.id) {
        saved = await updateEvent(form.id, payload);
      } else {
        saved = await insertEvent(payload);
      }
      await replaceAssignments(saved.id, selectedAssignmentIds);
      toast.success("Event saved");
      if (rangeStart && rangeEnd) {
        await loadEvents(rangeStart, rangeEnd);
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id) return;
    if (!confirm("Delete this event?")) return;
    try {
      await deleteEvent(form.id);
      toast.success("Event deleted");
      if (rangeStart && rangeEnd) {
        await loadEvents(rangeStart, rangeEnd);
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleConfirmNotify = async () => {
    if (!form.id) return;
    try {
      await confirmAndNotify(form.id);
      toast.success("Client notified (if function deployed)");
      if (rangeStart && rangeEnd) {
        await loadEvents(rangeStart, rangeEnd);
      }
    } catch (err: any) {
      toast.error(err.message || "Notify failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-600">
            Drag events to reschedule, click to edit, or select time slots to
            create new events.
          </p>
        </div>
        {loading && (
          <span className="text-xs font-medium text-slate-500">Loading...</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <span className="font-semibold">Team</span>
          <select
            value={currentTeamId || "all"}
            onChange={(e) => {
              const val = e.target.value === "all" ? null : e.target.value;
              setCurrentTeamId(val);
              if (rangeStart && rangeEnd) {
                loadEvents(rangeStart, rangeEnd, val);
              }
            }}
            className="rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All teams</option>
            {teams.length === 0 && <option value="">No teams</option>}
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          selectable
          selectMirror
          editable
          eventDrop={handleEventDrop}
          select={handleSelect}
          eventClick={handleEventClick}
          events={calendarEvents}
          datesSet={(arg) => {
            const startIso = arg.start.toISOString();
            const endIso = arg.end.toISOString();
            setRangeStart(startIso);
            setRangeEnd(endIso);
            loadEvents(startIso, endIso);
          }}
          height="75vh"
        />
      </div>

      <Modal
        open={modalOpen}
        title={form.id ? "Edit Event" : "New Event"}
        onClose={resetForm}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Team
              </label>
              <select
                value={form.team_id || ""}
                onChange={(e) =>
                  setForm({ ...form, team_id: e.target.value || null })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Project
              </label>
              <select
                value={form.project_id || ""}
                onChange={(e) =>
                  setForm({ ...form, project_id: e.target.value || null })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={form.status || ""}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Start time
              </label>
              <input
                type="datetime-local"
                value={form.start_time ? form.start_time.slice(0, 16) : ""}
                onChange={(e) =>
                  setForm({ ...form, start_time: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                End time
              </label>
              <input
                type="datetime-local"
                value={form.end_time ? form.end_time.slice(0, 16) : ""}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Assign crew
            </label>
            <div className="flex flex-wrap gap-2">
              {crewOptions.map((member) => {
                const checked = selectedAssignmentIds.includes(member.user_id);
                return (
                  <label
                    key={member.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                      checked
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssignmentIds((prev) => [
                            ...prev,
                            member.user_id,
                          ]);
                        } else {
                          setSelectedAssignmentIds((prev) =>
                            prev.filter((id) => id !== member.user_id),
                          );
                        }
                      }}
                    />
                    {member.display_name || member.user_id}
                  </label>
                );
              })}
              {crewOptions.length === 0 && (
                <p className="text-sm text-slate-500">
                  {form.team_id || currentTeamId
                    ? "No team members assigned."
                    : "Select a team to assign crew."}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-3">
            <div className="flex items-center gap-2">
              {form.id && (
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
              {form.id && (
                <button
                  onClick={handleConfirmNotify}
                  className="inline-flex items-center gap-1 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm & Notify Client
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetForm}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
