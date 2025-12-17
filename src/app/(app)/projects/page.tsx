"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "../../../components/Modal";
import {
  deleteProject,
  fetchEventsForProject,
  fetchProjects,
  insertProject,
  updateProject,
} from "../../../lib/data/projects";
import { fetchClients } from "../../../lib/data/clients";
import { Client, Event, Project } from "../../../lib/types";

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Planned", value: "planned" },
  { label: "Active", value: "active" },
  { label: "On Hold", value: "on_hold" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

type ProjectForm = Partial<Project>;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectEvents, setProjectEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ProjectForm>({});
  const [saving, setSaving] = useState(false);

  const filteredProjects = useMemo(() => projects, [projects]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [projData, clientData] = await Promise.all([
          fetchProjects(selectedStatus),
          clients.length === 0 ? fetchClients() : Promise.resolve(clients),
        ]);
        setProjects(projData);
        if (!clients.length) setClients(clientData);
      } catch (err: any) {
        toast.error(err.message || "Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedStatus]);

  useEffect(() => {
    const loadEvents = async () => {
      if (!selectedProject) {
        setProjectEvents([]);
        return;
      }
      try {
        const events = await fetchEventsForProject(selectedProject.id);
        setProjectEvents(events);
      } catch (err: any) {
        toast.error(err.message || "Failed to load events");
      }
    };
    loadEvents();
  }, [selectedProject]);

  const resetForm = () => {
    setForm({});
    setModalOpen(false);
  };

  const handleSave = async () => {
    if (!form.title) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        const updated = await updateProject(form.id, form);
        setProjects((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)),
        );
        toast.success("Project updated");
      } else {
        const created = await insertProject(form);
        setProjects((prev) => [created, ...prev]);
        toast.success("Project created");
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete project ${project.title}?`)) return;
    try {
      await deleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      if (selectedProject?.id === project.id) setSelectedProject(null);
      toast.success("Project deleted");
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-600">
            Track project pipeline and upcoming scheduled events.
          </p>
        </div>
        <button
          onClick={() => {
            setForm({});
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <Filter className="h-4 w-4 text-slate-400" />
        <label className="text-sm text-slate-700">Status</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-md border border-slate-200 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Priority
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading && (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={5}>
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading && filteredProjects.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={5}>
                      No projects found.
                    </td>
                  </tr>
                )}
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className={`cursor-pointer transition hover:bg-indigo-50 ${
                      selectedProject?.id === project.id ? "bg-indigo-50" : ""
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {project.title}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {clients.find((c) => c.id === project.client_id)?.name ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {project.status || "n/a"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {project.priority || "n/a"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm(project);
                            setModalOpen(true);
                          }}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(project);
                          }}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Upcoming events
            </h3>
            {selectedProject && (
              <span className="text-xs text-slate-500">
                {projectEvents.length} scheduled
              </span>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {!selectedProject && (
              <p className="text-sm text-slate-600">
                Select a project to view its events.
              </p>
            )}
            {selectedProject && projectEvents.length === 0 && (
              <p className="text-sm text-slate-500">No events yet.</p>
            )}
            {projectEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {new Date(event.start_time).toLocaleString()} —{" "}
                  {new Date(event.end_time).toLocaleString()}
                </p>
                <p className="text-xs text-slate-600">
                  Status: {event.status || "n/a"}
                </p>
                <p className="text-xs text-slate-500">{event.notes || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={form.id ? "Edit Project" : "New Project"}
        onClose={resetForm}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Title</label>
            <input
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Client
              </label>
              <select
                value={form.client_id || ""}
                onChange={(e) =>
                  setForm({ ...form, client_id: e.target.value || null })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
                <option value="">Select status</option>
                {statusOptions
                  .filter((o) => o.value !== "all")
                  .map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Priority
              </label>
              <select
                value={form.priority || ""}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Address
              </label>
              <input
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
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
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
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
      </Modal>
    </div>
  );
}
