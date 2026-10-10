
const API_URL = "http://localhost:3000";

export async function sendMetrics(metrics: unknown) {
    const response = await fetch(`${API_URL}/metrics`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(metrics)
    });

    if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
    }

    return await response.json();
}
