"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "../../../components/Modal";
import {
  deleteClient,
  fetchClients,
  fetchProjectsForClient,
  insertClient,
  updateClient,
} from "../../../lib/data/clients";
import { Client, Project } from "../../../lib/types";

type ClientFormState = Partial<Client>;

export default function ClientsPage() {
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ClientFormState>({});
  const [saving, setSaving] = useState(false);

  const filteredClients = useMemo(() => clientsList, [clientsList]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchClients(search.trim() || undefined);
        setClientsList(data);
      } catch (err: any) {
        toast.error(err.message || "Failed to load clients");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search]);

  useEffect(() => {
    const loadProjects = async () => {
      if (!selectedClient) {
        setClientProjects([]);
        return;
      }
      try {
        const data = await fetchProjectsForClient(selectedClient.id);
        setClientProjects(data);
      } catch (err: any) {
        toast.error(err.message || "Failed to load projects");
      }
    };
    loadProjects();
  }, [selectedClient]);

  const resetForm = () => {
    setForm({});
    setModalOpen(false);
  };

  const handleSave = async () => {
    if (!form.name) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        const updated = await updateClient(form.id, form);
        setClientsList((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
        toast.success("Client updated");
      } else {
        const created = await insertClient(form);
        setClientsList((prev) => [created, ...prev]);
        toast.success("Client added");
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (client: Client) => {
    if (!confirm(`Delete client ${client.name}?`)) return;
    try {
      await deleteClient(client.id);
      setClientsList((prev) => prev.filter((c) => c.id !== client.id));
      if (selectedClient?.id === client.id) {
        setSelectedClient(null);
      }
      toast.success("Client deleted");
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-600">
            Manage your customer records and quickly jump into their projects.
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
          New Client
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          placeholder="Search by name, email, or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm focus:outline-none"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Notes
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading && (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={4}>
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading && filteredClients.length === 0 && (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={4}>
                      No clients found.
                    </td>
                  </tr>
                )}
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className={`cursor-pointer transition hover:bg-indigo-50 ${
                      selectedClient?.id === client.id ? "bg-indigo-50" : ""
                    }`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {client.name}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex flex-col">
                        <span>{client.email}</span>
                        <span className="text-xs text-slate-500">
                          {client.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {client.notes || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm(client);
                            setModalOpen(true);
                          }}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(client);
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
              Projects for {selectedClient?.name || "—"}
            </h3>
            {selectedClient && (
              <span className="text-xs text-slate-500">
                {clientProjects.length} project(s)
              </span>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {!selectedClient && (
              <p className="text-sm text-slate-600">
                Select a client to see their projects.
              </p>
            )}
            {selectedClient && clientProjects.length === 0 && (
              <p className="text-sm text-slate-500">No projects yet.</p>
            )}
            {clientProjects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {project.title}
                </p>
                <p className="text-xs text-slate-600">
                  Status: {project.status || "n/a"} | Priority:{" "}
                  {project.priority || "n/a"}
                </p>
                <p className="text-xs text-slate-500">
                  {project.description || "No description"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={form.id ? "Edit Client" : "New Client"}
        onClose={resetForm}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
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
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
