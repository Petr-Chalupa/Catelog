/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Invite } from '../models/Invite';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InvitesService {
    /**
     * Get all invites related to the current user
     * @param t
     * @returns Invite List of invites
     * @throws ApiError
     */
    public static getInvites(
        t?: 'incoming' | 'outgoing',
    ): CancelablePromise<Array<Invite>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/invites',
            query: {
                't': t,
            },
            errors: {
                401: `Access token is missing or invalid`,
            },
        });
    }
    /**
     * Create a new invite
     * @param requestBody
     * @returns any Invite created
     * @throws ApiError
     */
    public static postInvites(
        requestBody: {
            listId: string;
            invitee: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/invites',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Access token is missing or invalid`,
            },
        });
    }
    /**
     * Get invite details by token
     * @param token
     * @returns Invite Invite metadata for display
     * @throws ApiError
     */
    public static getInvites1(
        token: string,
    ): CancelablePromise<Invite> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/invites/{token}',
            path: {
                'token': token,
            },
            errors: {
                404: `Invite not found`,
            },
        });
    }
    /**
     * Accept watchlist invite
     * @param token
     * @returns any Invite accepted
     * @throws ApiError
     */
    public static postInvitesAccept(
        token: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/invites/{token}/accept',
            path: {
                'token': token,
            },
            errors: {
                400: `Invite expired`,
                401: `Access token is missing or invalid`,
                403: `The authenticated user does not have permission to access this resource`,
                404: `Invite or related watchList not found`,
            },
        });
    }
    /**
     * Decline watchlist invite
     * @param id
     * @returns any Invite declined
     * @throws ApiError
     */
    public static deleteInvitesDecline(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/invites/{id}/decline',
            path: {
                'id': id,
            },
            errors: {
                401: `Access token is missing or invalid`,
                403: `The authenticated user does not have permission to access this resource`,
                404: `Invite not found`,
            },
        });
    }
}
