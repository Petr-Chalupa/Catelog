/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SystemService {
    /**
     * Trigger title enrichment manually
     * @returns any Enrichment started
     * @throws ApiError
     */
    public static postSystemTasksEnrich(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/system/tasks/enrich',
            errors: {
                401: `Access token is missing or invalid`,
                500: `There was an unexpected error`,
            },
        });
    }
    /**
     * Trigger database maintenance
     * @returns any Maintenance complete
     * @throws ApiError
     */
    public static postSystemTasksMaintenance(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/system/tasks/maintenance',
            errors: {
                401: `Access token is missing or invalid`,
                500: `There was an unexpected error`,
            },
        });
    }
}
