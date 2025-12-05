import { Hono } from 'hono';
import { zData } from '../services/z-api.service';

const webhook = new Hono();

enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    AUDIO = 'AUDIO',
    LOCATION = 'LOCATION',
    UNKNOWN = 'UNKNOWN'
}

interface IncomingMessage {
    provider: 'ZAPI';
    rawPhone: string;
    type: MessageType;
    payload: any;
}

function normalizeZApi(payload: any): IncomingMessage | null {
    let rawPhone = '';
    let type = MessageType.UNKNOWN;
    const data: any = {};

    if (payload.phone) {
        // Z-API Standard Format
        rawPhone = payload.phone;
        if (payload.text?.message) {
            type = MessageType.TEXT;
            data.text = payload.text.message;
        } else if (payload.audio?.audioUrl) {
            type = MessageType.AUDIO;
            data.url = payload.audio.audioUrl;
        } else if (payload.image?.imageUrl) {
            type = MessageType.IMAGE;
            data.url = payload.image.imageUrl;
            data.caption = payload.image.caption;
        } else if (payload.location) {
            type = MessageType.LOCATION;
            data.latitude = payload.location.latitude;
            data.longitude = payload.location.longitude;
        }
    } else if (payload.object === 'whatsapp_business_account') {
        // Cloud API Format (sometimes passed through Z-API)
        const msg = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (msg) {
            rawPhone = msg.from;
            if (msg.type === 'text') {
                type = MessageType.TEXT;
                data.text = msg.text.body;
            }
        }
    }

    if (!rawPhone || type === MessageType.UNKNOWN) return null;

    return {
        provider: 'ZAPI',
        rawPhone,
        type,
        payload: data
    };
}

webhook.post('/', async (c) => {
    try {
        const body = await c.req.json();
        const message = normalizeZApi(body);

        if (!message) {
            return c.json({ status: 'ignored' });
        }

        console.log(`📱 Webhook received from: ${message.rawPhone} | Type: ${message.type}`);

        // Example: Auto-reply "Received" (You can expand this with AI logic later)
        if (message.type === MessageType.TEXT) {
            // For now, just logging. 
            // await zData.sendText(message.rawPhone, `Received: ${message.payload.text}`);
        }

        return c.json({ status: 'processed' });
    } catch (error) {
        console.error('Webhook Error:', error);
        return c.json({ status: 'error' }, 500);
    }
});

export default webhook;
