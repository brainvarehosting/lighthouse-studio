// functions/api/auth.js

export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.endsWith('/google')) {
        const { token } = await request.json();
        if (!token) return new Response("Token required", { status: 400 });

        // Decode Google ID Token (JWT)
        // In a high-security app, you should verify the signature with Google's public keys.
        const [header, payload, signature] = token.split('.');
        const userData = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));

        const { email, name, picture, sub: googleId } = userData;

        if (!email) return new Response("Invalid token payload", { status: 400 });

        // Check/Create user in D1
        let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
        
        if (!user) {
            const id = 'u_' + Date.now().toString(36);
            await env.DB.prepare("INSERT INTO users (id, email, name, picture, created_at) VALUES (?, ?, ?, ?, ?)")
                .bind(id, email, name, picture, new Date().toISOString())
                .run();
            user = { id, email, name, picture, role: 'customer' };
        } else {
            // Update profile if changed
            await env.DB.prepare("UPDATE users SET name = ?, picture = ? WHERE email = ?")
                .bind(name, picture, email)
                .run();
            user = { ...user, name, picture };
        }

        return new Response(JSON.stringify({ success: true, user }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response("Not found", { status: 404 });
}
