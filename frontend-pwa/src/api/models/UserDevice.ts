/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserDevice = {
    id?: string;
    userId?: string;
    deviceName?: string;
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
    createdAt?: string;
};

