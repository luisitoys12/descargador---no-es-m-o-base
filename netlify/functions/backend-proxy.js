const DEFAULT_HEADERS = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'Content-Type,x-access-code,Authorization'
};

function withCors(statusCode, body = '', extraHeaders = {}) {
    return {
        statusCode,
        headers: {
            ...DEFAULT_HEADERS,
            ...extraHeaders
        },
        body
    };
}

exports.handler = async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return withCors(204);
    }

    const backendOrigin = process.env.BACKEND_ORIGIN;
    if (!backendOrigin) {
        return withCors(
            500,
            JSON.stringify({
                error: 'BACKEND_ORIGIN no está configurado en Netlify.'
            }),
            { 'content-type': 'application/json' }
        );
    }

    const normalizedOrigin = backendOrigin.replace(/\/+$/, '');
    const path = event.path.replace(/^\/backend/, '');
    const query = event.rawQuery ? `?${event.rawQuery}` : '';
    const targetUrl = `${normalizedOrigin}${path}${query}`;

    try {
        const headers = { ...event.headers };
        delete headers.host;
        delete headers['x-forwarded-for'];
        delete headers['x-forwarded-proto'];

        const response = await fetch(targetUrl, {
            method: event.httpMethod,
            headers,
            body: ['GET', 'HEAD'].includes(event.httpMethod) ? undefined : event.body
        });

        const responseBody = await response.text();
        const passHeaders = {
            'content-type': response.headers.get('content-type') || 'application/json'
        };

        return withCors(response.status, responseBody, passHeaders);
    } catch (error) {
        return withCors(
            502,
            JSON.stringify({ error: 'No se pudo conectar con el backend.', detail: error.message }),
            { 'content-type': 'application/json' }
        );
    }
};
