const swaggerJsdoc = require('swagger-jsdoc');

const SERVER_URL = process.env.SERVER_URL?.replace(/\/$/, '');
const API_SERVER_URL = SERVER_URL ? `${SERVER_URL}/api/v1` : '/api/v1';

const classSchema = {
    type: 'object',
    properties: {
        _id: { type: 'string', example: '665a0f1b2f4d2a0012b3c456' },
        title: { type: 'string', example: 'Beginner Badminton Class' },
        description: { type: 'string', example: 'Basic badminton techniques for new players.' },
        coachName: { type: 'string', example: 'Nguyen Van A' },
        level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], example: 'beginner' },
        startDate: { type: 'string', format: 'date-time', example: '2026-07-01T12:00:00.000Z' },
        endDate: { type: 'string', format: 'date-time', example: '2026-07-01T13:30:00.000Z' },
        schedule: { type: 'string', example: 'Mon/Wed/Fri 18:00-19:30' },
        location: { type: 'string', example: 'Court 1, District 1' },
        currentStudents: { type: 'integer', example: 3 },
        maxStudents: { type: 'integer', example: 20 },
        createdBy: {
            type: 'object',
            properties: {
                _id: { type: 'string', example: '665a0f1b2f4d2a0012b3c999' },
                name: { type: 'string', example: 'Admin' },
                email: { type: 'string', example: 'admin@example.com' },
                role: { type: 'string', example: 'admin' },
            },
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
    },
};

const classInputSchema = {
    type: 'object',
    required: ['title', 'description', 'coachName', 'level', 'startDate', 'endDate', 'schedule', 'location', 'maxStudents'],
    properties: {
        title: { type: 'string', example: 'Beginner Badminton Class' },
        description: { type: 'string', example: 'Basic badminton techniques for new players.' },
        coachName: { type: 'string', example: 'Nguyen Van A' },
        level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'], example: 'beginner' },
        startDate: { type: 'string', format: 'date-time', example: '2026-07-01T12:00:00.000Z' },
        endDate: { type: 'string', format: 'date-time', example: '2026-07-01T13:30:00.000Z' },
        schedule: { type: 'string', example: 'Mon/Wed/Fri 18:00-19:30' },
        location: { type: 'string', example: 'Court 1, District 1' },
        maxStudents: { type: 'integer', minimum: 1, example: 20 },
    },
};

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Badminton Booking System API',
            version: '1.0.0',
            description: 'API documentation for authentication and badminton classes.',
        },
        servers: [
            {
                url: API_SERVER_URL,
                description: SERVER_URL ? 'Configured API server' : 'Current API server',
            },
        ],
        tags: [
            { name: 'Health', description: 'API health check' },
            { name: 'Auth', description: 'Authentication APIs' },
            { name: 'Classes', description: 'Public and admin class APIs' },
            { name: 'Enrollments', description: 'User class enrollment APIs' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Class: classSchema,
                ClassInput: classInputSchema,
                Enrollment: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '665a0f1b2f4d2a0012b3c777' },
                        class: { $ref: '#/components/schemas/Class' },
                        user: {
                            type: 'object',
                            properties: {
                                _id: { type: 'string', example: '665a0f1b2f4d2a0012b3c999' },
                                name: { type: 'string', example: 'Nguyen Van B' },
                                email: { type: 'string', example: 'user@example.com' },
                                role: { type: 'string', example: 'user' },
                            },
                        },
                        enrolledAt: { type: 'string', format: 'date-time' },
                    },
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'fail' },
                        message: { type: 'string', example: 'Class not found' },
                    },
                },
            },
        },
        paths: {
            '/health': {
                get: {
                    tags: ['Health'],
                    summary: 'Check API health',
                    responses: {
                        200: {
                            description: 'API is healthy',
                        },
                    },
                },
            },
            '/auth/signup': {
                post: {
                    tags: ['Auth'],
                    summary: 'Start signup and send OTP',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name', 'email', 'password'],
                                    properties: {
                                        name: { type: 'string', example: 'Nguyen Van B' },
                                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                                        password: { type: 'string', format: 'password', example: 'password123' },
                                        role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
                                        adminInviteCode: { type: 'string', example: 'admin-secret-code' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        202: { description: 'OTP sent' },
                        400: { description: 'Missing required fields' },
                        409: { description: 'Email already in use' },
                    },
                },
            },
            '/auth/verify-signup-otp': {
                post: {
                    tags: ['Auth'],
                    summary: 'Verify signup OTP and create account',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'otp'],
                                    properties: {
                                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                                        otp: { type: 'string', example: '123456' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Account created' },
                        400: { description: 'Invalid or expired OTP' },
                        404: { description: 'Pending registration not found' },
                    },
                },
            },
            '/auth/resend-signup-otp': {
                post: {
                    tags: ['Auth'],
                    summary: 'Resend signup OTP',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email'],
                                    properties: {
                                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'OTP resent' },
                        404: { description: 'Pending registration not found' },
                    },
                },
            },
            '/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login with email and password',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', format: 'email', example: 'user@example.com' },
                                        password: { type: 'string', format: 'password', example: 'password123' },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Login successful' },
                        401: { description: 'Incorrect email or password' },
                    },
                },
            },
            '/auth/logout': {
                get: {
                    tags: ['Auth'],
                    summary: 'Logout current user',
                    responses: {
                        200: { description: 'Logout successful' },
                    },
                },
            },
            '/auth/me': {
                get: {
                    tags: ['Auth'],
                    summary: 'Get current user',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Current user' },
                        401: { description: 'Not logged in' },
                    },
                },
            },
            '/classes': {
                get: {
                    tags: ['Classes'],
                    summary: 'Get upcoming classes',
                    description: 'Public API. Returns classes with startDate greater than or equal to now. Supports search by title and filter by level.',
                    parameters: [
                        {
                            name: 'name',
                            in: 'query',
                            schema: { type: 'string' },
                            description: 'Search class title by name. Alias: title or search.',
                            example: 'beginner',
                        },
                        {
                            name: 'level',
                            in: 'query',
                            schema: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
                            description: 'Filter by class level.',
                        },
                    ],
                    responses: {
                        200: {
                            description: 'List of upcoming classes',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string', example: 'success' },
                                            results: { type: 'integer', example: 2 },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    classes: {
                                                        type: 'array',
                                                        items: { $ref: '#/components/schemas/Class' },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                post: {
                    tags: ['Classes'],
                    summary: 'Create a class',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ClassInput' },
                            },
                        },
                    },
                    responses: {
                        201: { description: 'Class created' },
                        401: { description: 'Not logged in' },
                        403: { description: 'Admin only' },
                    },
                },
            },
            '/classes/{id}': {
                get: {
                    tags: ['Classes'],
                    summary: 'Get class detail',
                    description: 'Public API used by class detail page.',
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            example: '665a0f1b2f4d2a0012b3c456',
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Class detail',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string', example: 'success' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    class: { $ref: '#/components/schemas/Class' },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: 'Invalid class id' },
                        404: { description: 'Class not found' },
                    },
                },
                patch: {
                    tags: ['Classes'],
                    summary: 'Update a class',
                    description: 'Admin only. Allows updating all class fields. Cannot reduce maxStudents below the number of currently enrolled students.',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/ClassInput' },
                            },
                        },
                    },
                    responses: {
                        200: { description: 'Class updated' },
                        400: { description: 'Invalid class id or maxStudents is lower than current enrolled students' },
                        401: { description: 'Not logged in' },
                        403: { description: 'Admin only' },
                        404: { description: 'Class not found' },
                    },
                },
                delete: {
                    tags: ['Classes'],
                    summary: 'Delete a class',
                    description: 'Admin only. Cannot delete a class that already has enrolled students.',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        204: { description: 'Class deleted' },
                        400: { description: 'Invalid class id or class has enrolled students' },
                        401: { description: 'Not logged in' },
                        403: { description: 'Admin only' },
                        404: { description: 'Class not found' },
                    },
                },
            },
            '/classes/{id}/students': {
                get: {
                    tags: ['Classes'],
                    summary: 'Get students in a class',
                    description: 'Admin only. Returns all students enrolled in the selected class.',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            example: '665a0f1b2f4d2a0012b3c456',
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Class students',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string', example: 'success' },
                                            results: { type: 'integer', example: 2 },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    class: {
                                                        type: 'object',
                                                        properties: {
                                                            _id: { type: 'string', example: '665a0f1b2f4d2a0012b3c456' },
                                                            title: { type: 'string', example: 'Beginner Badminton Class' },
                                                            currentStudents: { type: 'integer', example: 2 },
                                                            maxStudents: { type: 'integer', example: 8 },
                                                        },
                                                    },
                                                    students: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'object',
                                                            properties: {
                                                                enrollmentId: { type: 'string', example: '665a0f1b2f4d2a0012b3c777' },
                                                                enrolledAt: { type: 'string', format: 'date-time' },
                                                                user: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        _id: { type: 'string', example: '665a0f1b2f4d2a0012b3c999' },
                                                                        name: { type: 'string', example: 'Nguyen Van B' },
                                                                        email: { type: 'string', example: 'user@example.com' },
                                                                        role: { type: 'string', example: 'user' },
                                                                        isVerified: { type: 'boolean', example: true },
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: 'Invalid class id' },
                        401: { description: 'Not logged in' },
                        403: { description: 'Admin only' },
                        404: { description: 'Class not found' },
                    },
                },
            },
            '/classes/{id}/students/{userId}': {
                delete: {
                    tags: ['Classes'],
                    summary: 'Kick a student from a class',
                    description: 'Admin only. Removes the selected user enrollment from the selected class.',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            example: '665a0f1b2f4d2a0012b3c456',
                        },
                        {
                            name: 'userId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            example: '665a0f1b2f4d2a0012b3c999',
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Student removed',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string', example: 'success' },
                                            message: { type: 'string', example: 'Student removed from class successfully' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    class: {
                                                        type: 'object',
                                                        properties: {
                                                            _id: { type: 'string', example: '665a0f1b2f4d2a0012b3c456' },
                                                            title: { type: 'string', example: 'Beginner Badminton Class' },
                                                        },
                                                    },
                                                    removedStudent: {
                                                        type: 'object',
                                                        properties: {
                                                            _id: { type: 'string', example: '665a0f1b2f4d2a0012b3c999' },
                                                            name: { type: 'string', example: 'Nguyen Van B' },
                                                            email: { type: 'string', example: 'user@example.com' },
                                                            role: { type: 'string', example: 'user' },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: 'Invalid class id or user id' },
                        401: { description: 'Not logged in' },
                        403: { description: 'Admin only' },
                        404: { description: 'Class not found or student is not enrolled in this class' },
                    },
                },
            },
            '/enrollments/me': {
                get: {
                    tags: ['Enrollments'],
                    summary: 'Get my enrolled classes',
                    description: 'Returns the current user enrollments with populated class details.',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: {
                            description: 'Current user enrollments',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string', example: 'success' },
                                            results: { type: 'integer', example: 1 },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    enrollments: {
                                                        type: 'array',
                                                        items: { $ref: '#/components/schemas/Enrollment' },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        401: { description: 'Not logged in' },
                    },
                },
            },
            '/enrollments/classes/{classId}': {
                post: {
                    tags: ['Enrollments'],
                    summary: 'Enroll in a class',
                    description: 'Login required. The class must exist, be upcoming, not full, and not already enrolled by the current user.',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'classId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            example: '665a0f1b2f4d2a0012b3c456',
                        },
                    ],
                    responses: {
                        201: {
                            description: 'Enrollment created',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string', example: 'success' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    enrollment: { $ref: '#/components/schemas/Enrollment' },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: 'Invalid class id, class already started, or class is full' },
                        401: { description: 'Not logged in' },
                        404: { description: 'Class not found' },
                        409: { description: 'Already enrolled' },
                    },
                },
                delete: {
                    tags: ['Enrollments'],
                    summary: 'Cancel class enrollment',
                    description: 'Login required. Cancels the current user enrollment for the given class.',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'classId',
                            in: 'path',
                            required: true,
                            schema: { type: 'string' },
                            example: '665a0f1b2f4d2a0012b3c456',
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Enrollment cancelled',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: { type: 'string', example: 'success' },
                                            message: { type: 'string', example: 'Enrollment cancelled successfully' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    enrollment: { $ref: '#/components/schemas/Enrollment' },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: 'Invalid class id' },
                        401: { description: 'Not logged in' },
                        404: { description: 'Enrollment not found' },
                    },
                },
            },
        },
    },
    apis: [],
};

module.exports = swaggerJsdoc(options);
