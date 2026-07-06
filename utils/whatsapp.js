const fs = require('fs');

function formatPhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.trim().replace(/\s+/g, '');
    if (cleaned.startsWith('+')) {
        return cleaned;
    }
    if (cleaned.startsWith('0')) {
        return '+94' + cleaned.slice(1);
    }
    if (cleaned.length === 9 && cleaned.startsWith('7')) {
        return '+94' + cleaned;
    }
    return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
}

async function sendWhatsAppNotification(rawPhone, status, orderId) {
    const toPhone = formatPhoneNumber(rawPhone);
    const messages = {
        placed: '✅ Your FoodGo order has been successfully placed!',
        accepted: '✅ The restaurant has accepted your order and will start preparing it soon!',
        preparing: '🍳 Your food is being prepared in the kitchen.',
        ready: '🛍️ Your order is ready and waiting for the delivery partner.',
        out_for_delivery: '🛵 Your rider is on the way! Track your order live on the map.',
        delivered: '🎉 Your food has been delivered. Enjoy your meal!',
        cancelled: '❌ Your order has been cancelled.',
    };

    const bodyText = messages[status] || `Your order status updated to: ${status}`;
    const orderRef = orderId ? ` (Order #${orderId.toString().slice(-8).toUpperCase()})` : '';
    const messageContent = `${bodyText}${orderRef}`;

    console.log(`[WhatsApp Service] Preparing message to ${toPhone}: "${messageContent}"`);

    // Write to a log file for simulation/verification
    const logEntry = `[${new Date().toISOString()}] To: ${toPhone} | Message: ${messageContent}\n`;
    try {
        fs.appendFileSync('whatsapp-messages.log', logEntry);
    } catch (err) {
        console.error('Failed to write WhatsApp log:', err);
    }

    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } = process.env;

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_NUMBER) {
        try {
            const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
            const params = new URLSearchParams();
            params.append('From', `whatsapp:${TWILIO_WHATSAPP_NUMBER}`);
            params.append('To', `whatsapp:${toPhone}`);
            params.append('Body', messageContent);

            const res = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${auth}`,
                    },
                    body: params.toString(),
                }
            );

            const data = await res.json();
            if (res.ok) {
                console.log(`[WhatsApp Service] Twilio Msg Sent! SID: ${data.sid}`);
            } else {
                console.error('[WhatsApp Service] Twilio Error:', data.message || data);
            }
        } catch (error) {
            console.error('[WhatsApp Service] Twilio Send Exception:', error);
        }
    } else {
        console.log('[WhatsApp Service] Twilio credentials missing in env. Simulated message logged to whatsapp-messages.log.');
    }
}

module.exports = { sendWhatsAppNotification };
