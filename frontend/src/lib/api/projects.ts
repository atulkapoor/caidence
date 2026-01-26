import { API_BASE_URL } from "./core";

export interface Project {
    id: number;
    name: string;
    objective: string;
    project_type: string;
    status: string;
    created_at: string;
    owner_id?: number;
}

export async function createProject(project: { name: string; objective: string; project_type: string }): Promise<Project> {
    const res = await fetch(`${API_BASE_URL}/projects/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
    });
    if (!res.ok) throw new Error("Failed to create project");
    return res.json();
}
