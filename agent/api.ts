
const API_URL = "http://localhost:3000/metrics";

export async function sendMetrics(metrics: unknown) {
    const apiKey = process.env.SERMONI_API_KEY;

    if (!apiKey) {
        throw new Error("SERMONI_API_KEY is not set");
    }

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(metrics)
    });

    if (!response.ok) {
        const errorBody = await response.text();

        throw new Error(
            `Failed to send metrics: HTTP ${response.status} - ${errorBody}`
        );
    }

    return await response.json();
}
