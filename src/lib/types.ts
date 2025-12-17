export type UUID = string;

export type Client = {
  id: UUID;
  organization_id: UUID | null;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ProjectStatus = "planned" | "active" | "on_hold" | "completed" | "cancelled" | string;
export type Priority = "low" | "medium" | "high" | string;

export type Project = {
  id: UUID;
  organization_id: UUID | null;
  client_id: UUID | null;
  title: string;
  description: string | null;
  address: string | null;
  status: ProjectStatus | null;
  priority: Priority | null;
  created_at: string | null;
  updated_at: string | null;
};

export type EventStatus = "draft" | "scheduled" | "confirmed" | "cancelled" | string;

export type Event = {
  id: UUID;
  organization_id: UUID | null;
  project_id: UUID | null;
  team_id: UUID | null;
  start_time: string;
  end_time: string;
  timezone: string | null;
  status: EventStatus | null;
  notes: string | null;
  created_by: UUID | null;
  created_at: string | null;
  updated_at: string | null;
};

export type EventWithProject = Event & { project?: Project | null };

export type EventAssignment = {
  id: UUID;
  organization_id: UUID | null;
  event_id: UUID;
  user_id: UUID;
  created_at: string | null;
};

export type OrgMember = {
  id: UUID;
  organization_id: UUID | null;
  user_id: UUID;
  role: string | null;
  display_name: string | null;
};

export type Team = {
  id: UUID;
  organization_id: UUID | null;
  name: string;
  description: string | null;
  color: string | null;
  created_at: string | null;
};

export type TeamMember = {
  id: UUID;
  team_id: UUID;
  user_id: UUID;
  role: string | null;
  created_at: string | null;
};

export type SmsMessage = {
  id: UUID;
  organization_id: UUID | null;
  event_id: UUID | null;
  client_id: UUID | null;
  to_phone: string | null;
  body: string | null;
  status: string | null;
  provider_message_id: string | null;
  sent_at: string | null;
  created_at: string | null;
};
