import { API_BASE_URL } from "./core";

export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
}

export async function sendChatMessage(message: string, session_id?: string): Promise<{ response: string; session_id: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout

    try {
        const res = await fetch(`${API_BASE_URL}/chat/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, session_id }),
            signal: controller.signal
        });

        if (!res.ok) throw new Error("Failed to send message");
        return res.json();
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function fetchChatHistory(session_id: string): Promise<ChatMessage[]> {
    const res = await fetch(`${API_BASE_URL}/chat/history/${session_id}`);
    if (!res.ok) throw new Error("Failed to fetch chat history");
    return res.json();
}
