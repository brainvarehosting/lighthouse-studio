// functions/api/files.js

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const fileName = url.searchParams.get('file');

    if (!fileName) {
        return new Response("Missing file parameter", { status: 400 });
    }

    // In a real production app, you would check authentication here via Clerk or JWT
    // const user = await checkAuth(request); 
    // if (!user) return new Response("Unauthorized", { status: 401 });

    try {
        const object = await env.BUCKET.get(fileName);

        if (!object) {
            return new Response("File not found", { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        return new Response(object.body, {
            headers
        });
    } catch (err) {
        return new Response(err.message, { status: 500 });
    }
}
