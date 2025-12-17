"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "../../../components/Modal";
import { fetchMembers } from "../../../lib/data/members";
import {
  fetchTeams,
  insertTeam,
  updateTeam,
  deleteTeam,
  fetchTeamMembers,
} from "../../../lib/data/teams";
import { replaceTeamMembers } from "../../../lib/data/teamMembers";
import { OrgMember, Team, TeamMember } from "../../../lib/types";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

type TeamForm = Partial<Team>;

export default function TeamPage() {
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TeamForm>({});
  const [saving, setSaving] = useState(false);
  const [memberSelection, setMemberSelection] = useState<string[]>([]);

  const selectedTeamMembers = useMemo(() => {
    if (!form.id) return [];
    return teamMembers[form.id] || [];
  }, [form.id, teamMembers]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [membersData, teamsData] = await Promise.all([
          fetchMembers(),
          fetchTeams(),
        ]);
        setOrgMembers(membersData);
        setTeams(teamsData);
        // Preload members for existing teams
        const memberMap: Record<string, TeamMember[]> = {};
        for (const t of teamsData) {
          const tms = await fetchTeamMembers(t.id);
          memberMap[t.id] = tms;
        }
        setTeamMembers(memberMap);
      } catch (err: any) {
        toast.error(err.message || "Failed to load teams");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const resetModal = () => {
    setForm({});
    setMemberSelection([]);
    setModalOpen(false);
  };

  const openNewTeam = () => {
    setForm({});
    setMemberSelection([]);
    setModalOpen(true);
  };

  const openEditTeam = async (team: Team) => {
    setForm(team);
    const currentMembers = teamMembers[team.id] || (await fetchTeamMembers(team.id));
    setTeamMembers((prev) => ({ ...prev, [team.id]: currentMembers }));
    setMemberSelection(currentMembers.map((m) => m.user_id));
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Team name is required");
      return;
    }
    setSaving(true);
    try {
      let saved: Team;
      if (form.id) {
        saved = await updateTeam(form.id, form);
      } else {
        saved = await insertTeam(form);
      }
      await replaceTeamMembers(saved.id, memberSelection);
      // Refresh team list
      const teamsData = await fetchTeams();
      setTeams(teamsData);
      const tms = await fetchTeamMembers(saved.id);
      setTeamMembers((prev) => ({ ...prev, [saved.id]: tms }));
      toast.success("Team saved");
      resetModal();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (team: Team) => {
    if (!confirm(`Delete team ${team.name}?`)) return;
    try {
      await deleteTeam(team.id);
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
      const copy = { ...teamMembers };
      delete copy[team.id];
      setTeamMembers(copy);
      toast.success("Team deleted");
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Teams</h1>
          <p className="text-sm text-slate-600">
            Create teams, assign members, and use them to filter schedules.
          </p>
        </div>
        <button
          onClick={openNewTeam}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Team
        </button>
      </div>

      {loading && (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Loading teams...
        </div>
      )}

      {!loading && teams.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No teams yet. Create one to start assigning schedules.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <div
            key={team.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-slate-900">
                    {team.name}
                  </span>
                  {team.color && (
                    <span
                      className="h-3 w-3 rounded-full border border-slate-200"
                      style={{ backgroundColor: team.color }}
                    />
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  {team.description || "No description"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditTeam(team)}
                  className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                  aria-label="Edit team"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(team)}
                  className="rounded-md border border-red-200 p-2 text-red-600 hover:bg-red-50"
                  aria-label="Delete team"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <Users className="h-4 w-4" />
              <span>
                {teamMembers[team.id]?.length || 0} member
                {(teamMembers[team.id]?.length || 0) === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              {(teamMembers[team.id] || []).map((tm) => {
                const user = orgMembers.find((m) => m.user_id === tm.user_id);
                return (
                  <div
                    key={tm.id}
                    className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1"
                  >
                    {user?.display_name || user?.user_id || tm.user_id}
                  </div>
                );
              })}
              {teamMembers[team.id]?.length === 0 && (
                <p className="text-slate-500">No members yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        title={form.id ? "Edit Team" : "New Team"}
        onClose={resetModal}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Color</label>
            <input
              type="color"
              value={form.color || "#6366f1"}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-10 w-16 cursor-pointer rounded-md border border-slate-200 bg-white p-1"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Members
            </label>
            <div className="flex flex-wrap gap-2">
              {orgMembers.map((m) => {
                const checked = memberSelection.includes(m.user_id);
                return (
                  <label
                    key={m.user_id}
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
                          setMemberSelection((prev) => [...prev, m.user_id]);
                        } else {
                          setMemberSelection((prev) =>
                            prev.filter((id) => id !== m.user_id),
                          );
                        }
                      }}
                    />
                    {m.display_name || m.user_id}
                  </label>
                );
              })}
              {orgMembers.length === 0 && (
                <p className="text-sm text-slate-500">No org members found.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={resetModal}
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
      </Modal>
    </div>
  );
}
