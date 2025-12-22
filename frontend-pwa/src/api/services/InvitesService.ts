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
     * Create invite to watchlist
     * @param listId
     * @param requestBody
     * @returns Invite Invite created
     * @throws ApiError
     */
    public static postWatchlistsInvites(
        listId: string,
        requestBody: {
            inviteeId?: string;
        },
    ): CancelablePromise<Invite> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/watchlists/{listId}/invites',
            path: {
                'listId': listId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Access token is missing or invalid`,
                403: `The authenticated user does not have permission to access this resource`,
                404: `WatchList not found`,
                500: `Unexpected error while creating invite`,
            },
        });
    }
    /**
     * Accept watchlist invite
     * @param token
     * @returns any Invite accepted
     * @throws ApiError
     */
    public static postWatchlistsInvitesAccept(
        token: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/watchlists/invites/{token}/accept',
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
}
