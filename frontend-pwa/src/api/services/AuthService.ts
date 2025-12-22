/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Start OAuth flow
     * @param provider
     * @param redirect
     * @returns void
     * @throws ApiError
     */
    public static getUserAuth(
        provider: string,
        redirect: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user/auth',
            query: {
                'provider': provider,
                'redirect': redirect,
            },
            errors: {
                302: `Redirect to OAuth`,
                400: `Invalid provider`,
            },
        });
    }
    /**
     * Google OAuth callback
     * @param code
     * @param state
     * @returns void
     * @throws ApiError
     */
    public static getUserAuthGoogleCallback(
        code: string,
        state: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user/auth/google/callback',
            query: {
                'code': code,
                'state': state,
            },
            errors: {
                302: `Redirect to frontend with auth result`,
                400: `Invalid OAuth session`,
                404: `User not found`,
            },
        });
    }
    /**
     * Microsoft OAuth callback
     * @param code
     * @param state
     * @returns void
     * @throws ApiError
     */
    public static getUserAuthMicrosoftCallback(
        code: string,
        state: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user/auth/microsoft/callback',
            query: {
                'code': code,
                'state': state,
            },
            errors: {
                302: `Redirect to frontend with auth result`,
                400: `Invalid OAuth session`,
                404: `User not found`,
            },
        });
    }
    /**
     * Exchange a refresh token for a new access token
     * @returns any New token issued
     * @throws ApiError
     */
    public static postUserAuthRefresh(): CancelablePromise<{
        accessToken: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/auth/refresh',
            errors: {
                401: `Access token is missing or invalid`,
            },
        });
    }
    /**
     * Revoke the refresh token and clear cookies
     * @returns any Successfully logged out
     * @throws ApiError
     */
    public static postUserAuthLogout(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/auth/logout',
        });
    }
}
