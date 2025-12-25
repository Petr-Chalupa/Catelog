/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { User } from '../models/User';
import type { UserDevice } from '../models/UserDevice';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserService {
    /**
     * Get current authenticated user profile
     * @returns User The authenticated user object
     * @throws ApiError
     */
    public static getUserMe(): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user/me',
            errors: {
                401: `Access token is missing or invalid`,
                404: `User not found`,
            },
        });
    }
    /**
     * Update user profile
     * @param requestBody
     * @returns User Profile updated
     * @throws ApiError
     */
    public static patchUserMe(
        requestBody?: {
            name?: string;
            email?: string;
            notificationsEnabled?: boolean;
        },
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/user/me',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `No data provided for update`,
                401: `Access token is missing or invalid`,
                404: `User not found`,
            },
        });
    }
    /**
     * Delete user account and all connected data
     * @returns any Account deleted successfully
     * @throws ApiError
     */
    public static deleteUserMe(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/user/me',
            errors: {
                401: `Access token is missing or invalid`,
                500: `Unexpected error while deleting user data`,
            },
        });
    }
    /**
     * Register a device for push notifications
     * @param requestBody
     * @returns any Device subscribed successfully
     * @throws ApiError
     */
    public static postUserDevicesSubscribe(
        requestBody: UserDevice,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/devices/subscribe',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Access token is missing or invalid`,
            },
        });
    }
    /**
     * Unsubscribe a device from push notifications
     * @param requestBody
     * @returns any Device unsubscribed successfully
     * @throws ApiError
     */
    public static postUserDevicesUnsubscribe(
        requestBody: {
            endpoint: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/devices/unsubscribe',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Access token is missing or invalid`,
                500: `Unexpected error while deleting user device`,
            },
        });
    }
}
