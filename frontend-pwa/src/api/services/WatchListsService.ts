/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WatchList } from '../models/WatchList';
import type { WatchListItem } from '../models/WatchListItem';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WatchListsService {
    /**
     * Get all user watchlists
     * @returns WatchList WatchLists
     * @throws ApiError
     */
    public static getWatchlists(): CancelablePromise<Array<WatchList>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/watchlists',
            errors: {
                401: `Access token is missing or invalid`,
                403: `The authenticated user does not have permission to access this resource`,
                404: `The requested resource was not found`,
                500: `There was an unexpected error`,
            },
        });
    }
    /**
     * Create a new watchlist
     * @param requestBody
     * @returns WatchList WatchList created
     * @throws ApiError
     */
    public static postWatchlists(
        requestBody: {
            name: string;
        },
    ): CancelablePromise<WatchList> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/watchlists',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Access token is missing or invalid`,
                403: `The authenticated user does not have permission to access this resource`,
                404: `The requested resource was not found`,
                500: `There was an unexpected error`,
            },
        });
    }
    /**
     * Get watchlist by ID
     * @param listId
     * @returns WatchList WatchList
     * @throws ApiError
     */
    public static getWatchlists1(
        listId: string,
    ): CancelablePromise<WatchList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/watchlists/{listId}',
            path: {
                'listId': listId,
            },
            errors: {
                401: `Access token is missing or invalid`,
                403: `The authenticated user does not have permission to access this resource`,
                500: `There was an unexpected error`,
            },
        });
    }
    /**
     * Update watchlist details
     * @param listId
     * @param requestBody
     * @returns WatchList WatchList updated
     * @throws ApiError
     */
    public static patchWatchlists(
        listId: string,
        requestBody: {
            name?: string;
            sharedWith?: Array<string>;
            sortKey?: string;
        },
    ): CancelablePromise<WatchList> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/watchlists/{listId}',
            path: {
                'listId': listId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Access token is missing or invalid`,
                403: `The authenticated user does not have permission to access this resource`,
                404: `The requested resource was not found`,
                500: `There was an unexpected error`,
            },
        });
    }
    /**
     * Delete a specific watchlist
     * @param listId
     * @returns any WatchList processed successfully
     * @throws ApiError
     */
    public static deleteWatchlists(
        listId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/watchlists/{listId}',
            path: {
                'listId': listId,
            },
            errors: {
                401: `Access token is missing or invalid`,
                403: `The authenticated user does not have permission to access this resource`,
                404: `The requested resource was not found`,
                500: `There was an unexpected error`,
            },
        });
    }
    /**
     * Transfer ownership of a watchlist
     * @param listId
     * @param requestBody
     * @returns any Ownership transferred successfully
     * @throws ApiError
     */
    public static postWatchlistsTransfer(
        listId: string,
        requestBody: {
            newOwnerId: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/watchlists/{listId}/transfer',
            path: {
                'listId': listId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Access token is missing or invalid`,
                403: `The authenticated user does not have permission to access this resource`,
                404: `The requested resource was not found`,
                500: `There was an unexpected error`,
            },
        });
    }
    /**
     * Get items in a watchlist
     * @param listId
     * @returns any WatchList items
     * @throws ApiError
     */
    public static getWatchlistsItems(
        listId: string,
    ): CancelablePromise<{
        items?: Array<WatchListItem>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/watchlists/{listId}/items',
            path: {
                'listId': listId,
            },
            errors: {
                403: `The authenticated user does not have permission to access this resource`,
                404: `The requested resource was not found`,
                500: `There was an unexpected error`,
            },
        });
    }
    /**
     * Add item to watchlist
     * @param listId
     * @param requestBody
     * @returns WatchListItem Item added
     * @throws ApiError
     */
    public static postWatchlistsItems(
        listId: string,
        requestBody: {
            titleId: string;
        },
    ): CancelablePromise<WatchListItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/watchlists/{listId}/items',
            path: {
                'listId': listId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Access token is missing or invalid`,
                403: `The authenticated user does not have permission to access this resource`,
                404: `The requested resource was not found`,
                500: `There was an unexpected error`,
            },
        });
    }
    /**
     * Update watchlist item
     * @param listId
     * @param itemId
     * @param requestBody
     * @returns any Item updated
     * @throws ApiError
     */
    public static patchWatchlistsItems(
        listId: string,
        itemId: string,
        requestBody: {
            state?: 'planned' | 'started' | 'finished';
            tags?: Array<string>;
            personalRating?: number;
            sortKey?: string;
        },
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/watchlists/{listId}/items/{itemId}',
            path: {
                'listId': listId,
                'itemId': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Access token is missing or invalid`,
                403: `The authenticated user does not have permission to access this resource`,
                404: `The requested resource was not found`,
                500: `There was an unexpected error`,
            },
        });
    }
    /**
     * Remove item from watchlist
     * @param listId
     * @param itemId
     * @returns any Item removed
     * @throws ApiError
     */
    public static deleteWatchlistsItems(
        listId: string,
        itemId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/watchlists/{listId}/items/{itemId}',
            path: {
                'listId': listId,
                'itemId': itemId,
            },
            errors: {
                401: `Access token is missing or invalid`,
                403: `The authenticated user does not have permission to access this resource`,
                404: `The requested resource was not found`,
                500: `There was an unexpected error`,
            },
        });
    }
}
