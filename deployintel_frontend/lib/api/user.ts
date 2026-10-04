function getApiBaseUrl(): string {
    if (typeof window !== "undefined") {
        return "";
    }
    return (
        process.env.BACKEND_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8080"
    );
}

export interface EditProfilePayload {
    firstName: string;
    lastName: string;
    phone?: string;
    avatarUrl?: string;
}

export async function editProfile(payload: EditProfilePayload) {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/v1/users/profile`;

    const token = localStorage.getItem("access_token");
    if (!token) {
        throw new Error("No authentication token found");
    }

    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
    });
    if (res.ok) {
        return true;
    } else {
        console.error("Failed to update profile");
        return false;
    }
}