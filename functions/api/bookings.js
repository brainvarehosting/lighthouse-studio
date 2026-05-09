// functions/api/bookings.js

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const booking = await request.json();
        
        // Generate a unique ID if not present
        const id = booking.id || 'bk_' + Date.now().toString(36);
        const createdAt = new Date().toISOString();

        // Insert into D1
        const result = await env.DB.prepare(`
            INSERT INTO bookings (
                id, booking_id, customer_name, customer_email, customer_phone,
                service_id, package_id, booking_date, start_hour, end_hour,
                duration, total_amount, payment_choice, advance_amount, balance_amount,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            id,
            booking.bookingId,
            booking.name,
            booking.email,
            booking.phone,
            booking.serviceId,
            booking.packageId,
            booking.date,
            booking.startHour,
            booking.endHour,
            booking.duration,
            booking.totalAmount,
            booking.paymentChoice,
            booking.advanceAmount,
            booking.balanceAmount,
            createdAt
        ).run();

        return new Response(JSON.stringify({ success: true, id: id, bookingId: booking.bookingId }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestGet(context) {
    const { env } = context;
    
    try {
        const { results } = await env.DB.prepare("SELECT * FROM bookings ORDER BY created_at DESC").all();
        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
