import { API_BASE_URL } from "./core";

export interface Workflow {
    id: number;
    name: string;
    description: string;
    status: string;
    steps_json: string;
    run_count: number;
    last_run?: string;
    created_at: string;
}

export interface WorkflowRun {
    id: number;
    workflow_id: number;
    status: string;
    logs: string;
    started_at: string;
    completed_at?: string;
}

export async function fetchWorkflows(): Promise<Workflow[]> {
    const res = await fetch(`${API_BASE_URL}/workflow`);
    if (!res.ok) throw new Error("Failed to fetch workflows");
    return res.json();
}

export async function createWorkflow(data: { name: string; description: string; steps_json: string }): Promise<Workflow> {
    const res = await fetch(`${API_BASE_URL}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errText = await res.text();
        console.error("Create Workflow Error:", errText);
        throw new Error(`Failed to create workflow: ${errText}`);
    }
    return res.json();
}

export async function updateWorkflow(id: number, data: { name: string; description: string; steps_json: string }): Promise<Workflow> {
    const res = await fetch(`${API_BASE_URL}/workflow/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update workflow");
    return res.json();
}

export async function fetchWorkflowById(id: number): Promise<Workflow> {
    const res = await fetch(`${API_BASE_URL}/workflow/${id}`);
    if (!res.ok) throw new Error("Failed to fetch workflow");
    return res.json();
}

export async function fetchWorkflowHistory(id: number): Promise<WorkflowRun[]> {
    const res = await fetch(`${API_BASE_URL}/workflow/${id}/history`);
    if (!res.ok) throw new Error("Failed to fetch workflow history");
    return res.json();
}

export async function runWorkflow(id: number): Promise<WorkflowRun> {
    const res = await fetch(`${API_BASE_URL}/workflow/${id}/run`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to run workflow");
    return res.json();
}
