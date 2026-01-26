import { API_BASE_URL } from "./core";

export const fetchCommunicationStatus = async () => {
    const response = await fetch(`${API_BASE_URL}/communications/status`);
    if (!response.ok) throw new Error("Failed to fetch communication status");
    return response.json();
};

export const sendTestEmail = async (to_email: string, subject: string, body: string) => {
    const response = await fetch(`${API_BASE_URL}/communications/send/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_email, subject, body }),
    });
    if (!response.ok) throw new Error("Failed to send email");
    return response.json();
};

export const sendTestSMS = async (phone_number: string, message: string) => {
    const response = await fetch(`${API_BASE_URL}/communications/send/sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number, message }),
    });
    if (!response.ok) throw new Error("Failed to send SMS");
    return response.json();
};

export const sendTestWhatsApp = async (phone_number: string, content: string) => {
    const response = await fetch(`${API_BASE_URL}/communications/send/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number, content }),
    });
    if (!response.ok) throw new Error("Failed to send WhatsApp");
    return response.json();
};
