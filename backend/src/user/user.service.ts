import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import {
    createOAuthSession,
    createRefreshToken,
    deleteOAuthSession,
    getOAuthSession,
    upsertUser,
} from "../user/user.adapter";
import { APIError } from "../middleware/error.middleware";
import axios from "axios";

export function issueJWT(userId: string): string {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: "1h" });
}

export function generateCodeVerifier() {
    return crypto.randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(verifier: string) {
    return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export async function startGoogleOAuth(redirectUrl: string): Promise<string> {
    const state = crypto.randomUUID();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    await createOAuthSession({
        state,
        provider: "google",
        codeVerifier,
        redirectUrl,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
    url.searchParams.set("redirect_uri", process.env.GOOGLE_CALLBACK_URL!);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");

    return url.toString();
}

export async function finishGoogleOAuth(
    code: string,
    state: string
): Promise<{ refreshToken: string; redirectUrl: string }> {
    const session = await getOAuthSession(state);
    if (!session || session.provider !== "google") throw new APIError(400, "Invalid OAuth session");
    if (session.expiresAt < new Date()) throw new APIError(400, "OAuth session expired");

    const client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL
    );

    const { tokens } = await client.getToken({ code, codeVerifier: session.codeVerifier });
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token!, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    const user = await upsertUser({ email: payload!.email, name: payload!.name });
    if (!user) throw new APIError(404, "User not found");

    const accessToken = issueJWT(user.id);
    const refreshToken = await createRefreshToken(user.id);
    await deleteOAuthSession(state);

    const url = new URL(session.redirectUrl);
    url.searchParams.set("token", accessToken);

    return { refreshToken, redirectUrl: url.toString() };
}

export async function startMicrosoftOAuth(redirectUrl: string): Promise<string> {
    const state = crypto.randomUUID();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    await createOAuthSession({
        state,
        provider: "microsoft",
        codeVerifier,
        redirectUrl,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    const url = new URL("https://login.microsoftonline.com/common/oauth2/v2.0/authorize");
    url.searchParams.set("client_id", process.env.MS_CLIENT_ID!);
    url.searchParams.set("redirect_uri", process.env.MS_CALLBACK_URL!);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile User.Read");
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");

    return url.toString();
}

export async function finishMicrosoftOAuth(
    code: string,
    state: string
): Promise<{ refreshToken: string; redirectUrl: string }> {
    const session = await getOAuthSession(state);
    if (!session || session.provider !== "microsoft") throw new APIError(400, "Invalid OAuth session");
    if (session.expiresAt < new Date()) throw new APIError(400, "OAuth session expired");

    const tokens = (
        await axios.post(
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            new URLSearchParams({
                client_id: process.env.MS_CLIENT_ID!,
                client_secret: process.env.MS_CLIENT_SECRET!,
                code,
                code_verifier: session.codeVerifier,
                grant_type: "authorization_code",
                redirect_uri: process.env.MS_CALLBACK_URL!,
            })
        )
    ).data;

    const profile = (
        await axios.get("https://graph.microsoft.com/v1.0/me", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        })
    ).data;

    const user = await upsertUser({ email: profile.mail || profile.userPrincipalName, name: profile.displayName });
    if (!user) throw new APIError(404, "User not found");

    const accessToken = issueJWT(user.id);
    const refreshToken = await createRefreshToken(user.id);
    await deleteOAuthSession(state);

    const url = new URL(session.redirectUrl);
    url.searchParams.set("token", accessToken);

    return { refreshToken, redirectUrl: url.toString() };
}
