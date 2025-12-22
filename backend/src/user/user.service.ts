import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { upsertUser } from "../user/user.adapter";
import { User } from "../user/user.model";
import { APIError } from "../middleware/error.middleware";

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const MS_CLIENT_ID = process.env.MS_CLIENT_ID;
if (!JWT_SECRET || !GOOGLE_CLIENT_ID || !MS_CLIENT_ID) throw new Error("Auth env variable(s) not set");

export function issueJWT(userId: string): string {
    return jwt.sign({ id: userId }, JWT_SECRET!, { expiresIn: "1d" });
}

export async function handleAuth(token: string, provider: string): Promise<{ jwt: string; user: User }> {
    if (provider === "google") {
        return await handleGoogleAuth(token);
    }

    if (provider === "microsoft") {
        return await handleMicrosoftAuth(token);
    }

    throw new APIError(400, "Unsupported provider");
}

export async function handleGoogleAuth(idToken: string): Promise<{ jwt: string; user: User }> {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) throw new APIError(400, "Invalid Google token");

    const user = await upsertUser({
        email: payload.email,
        name: payload.name,
    });
    if (!user) throw new APIError(500, "Error finding user!");

    const token = issueJWT(user.id);

    return { jwt: token, user };
}

export async function handleMicrosoftAuth(accessToken: string): Promise<{ jwt: string; user: User }> {
    const response = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payload = await response.json();

    if (!response.ok || !payload.mail) throw new APIError(400, "Invalid Microsoft token");

    const user = await upsertUser({
        email: payload.email || payload.userPrincipalName,
        name: payload.displayName,
    });
    if (!user) throw new APIError(500, "Error upserting user to DB!");

    const token = issueJWT(user.id);

    return { jwt: token, user };
}
