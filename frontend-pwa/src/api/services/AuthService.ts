/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Authenticate with an external provider
     * @param requestBody
     * @returns any Successful authentication
     * @throws ApiError
     */
    public static postUserAuthLogin(
        requestBody: {
            token: string;
            provider: 'google' | 'microsoft';
        },
    ): CancelablePromise<{
        jwt?: string;
        user?: User;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Unsupported provider or invalid token`,
            },
        });
    }
    /**
     * Exchange a refresh token for a new access token
     * @returns any New JWT issued
     * @throws ApiError
     */
    public static postUserAuthRefresh(): CancelablePromise<{
        jwt?: string;
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
