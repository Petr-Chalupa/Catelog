import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
if (!GOOGLE_CLIENT_ID || !JWT_SECRET) throw new Error("Auth env variable(s) not set");

const client: OAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function handleGoogleAuth(idToken: string): Promise<{ jwt: string; user: User }> {
    const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) throw new Error("Invalid token");

    const user: User = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        createdAt: new Date(),
    };

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET!, { expiresIn: "7d" });

    return { jwt: token, user };
}
