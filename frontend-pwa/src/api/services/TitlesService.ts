/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Title } from '../models/Title';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TitlesService {
    /**
     * Add a title to catalogue
     * @param requestBody
     * @returns Title Title added
     * @throws ApiError
     */
    public static postTitles(
        requestBody: Title,
    ): CancelablePromise<Title> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/titles',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Access token is missing or invalid`,
                500: `Unexpected error while inserting title`,
            },
        });
    }
    /**
     * Get title by ID
     * @param id
     * @returns Title Title details
     * @throws ApiError
     */
    public static getTitles(
        id: string,
    ): CancelablePromise<Title> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/titles/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Access token is missing or invalid`,
                404: `Title not found`,
            },
        });
    }
    /**
     * Refresh title metadata or discover candidates
     * @param id
     * @returns Title Refresh triggered successfully, returns the updated title state
     * @throws ApiError
     */
    public static postTitlesRefresh(
        id: string,
    ): CancelablePromise<Title> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/titles/{id}/refresh',
            path: {
                'id': id,
            },
            errors: {
                401: `Access token is missing or invalid`,
                404: `Title not found`,
                500: `Internal server error during enrichment`,
            },
        });
    }
    /**
     * Search for a title in external sources
     * @param q Search query (title name)
     * @returns Title List of matching titles
     * @throws ApiError
     */
    public static getTitlesSearch(
        q: string,
    ): CancelablePromise<Array<Title>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/titles/search',
            query: {
                'q': q,
            },
            errors: {
                401: `Access token is missing or invalid`,
                500: `Search failed`,
            },
        });
    }
}
