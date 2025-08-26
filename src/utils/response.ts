
// Express.js Helper Functions
import { type Response } from 'express';

// Customer Support API Response Interface

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string | undefined;
    error?: {
        code: string;
        message: string;
    };
    timestamp: string;
    requestId?: string | undefined;
}

// Common Error Codes for Customer Support
export enum ErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    TICKET_CLOSED = 'TICKET_CLOSED',
    INVALID_STATUS = 'INVALID_STATUS',
}

// HTTP Status Codes
export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_ERROR = 500,
}

// Response Functions
export const success = <T>(
    data: T,
    message?: string,
    requestId?: string
): ApiResponse<T> => ({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId,
});

export const error = (
    code: ErrorCode,
    message: string,
    requestId?: string
): ApiResponse<null> => ({
    success: false,
    error: { code, message },
    timestamp: new Date().toISOString(),
    requestId,
});

export const sendSuccess = <T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = HttpStatus.OK,
    requestId?: string
) => {
    return res.status(statusCode).json(success(data, message, requestId));
};



export const sendError = (
    res: Response,
    code: ErrorCode,
    message: string,
    statusCode: number = HttpStatus.INTERNAL_ERROR,
    requestId?: string
) => {
    return res.status(statusCode).json(error(code, message, requestId));
};