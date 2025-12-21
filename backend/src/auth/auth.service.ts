import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { upsertUser } from "../user/user.adapter";
import { User } from "../user/user.model";

const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const MS_CLIENT_ID = process.env.MS_CLIENT_ID;
if (!JWT_SECRET || !GOOGLE_CLIENT_ID || !MS_CLIENT_ID) throw new Error("Auth env variable(s) not set");

export async function handleGoogleAuth(idToken: string): Promise<{ jwt: string; user: User }> {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) throw new Error("Invalid Google token");

    const user = await upsertUser({
        email: payload.email,
        name: payload.name,
    });
    if (!user) throw new Error("Error upserting user to DB!");

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET!, { expiresIn: "7d" });

    return { jwt: token, user };
}

export async function handleMicrosoftAuth(accessToken: string): Promise<{ jwt: string; user: User }> {
    const response = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const payload = await response.json();

    if (!response.ok || !payload.mail) throw new Error("Invalid Microsoft token");

    const user = await upsertUser({
        email: payload.email || payload.userPrincipalName,
        name: payload.displayName,
    });
    if (!user) throw new Error("Error upserting user to DB!");

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET!, { expiresIn: "7d" });

    return { jwt: token, user };
}
