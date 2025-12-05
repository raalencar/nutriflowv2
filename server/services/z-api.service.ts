import axios from 'axios';

export interface ZApiConfig {
    instanceId: string;
    token: string;
    clientToken?: string;
}

export class ZApiService {
    private baseUrl = 'https://api.z-api.io/instances';
    private config: ZApiConfig;

    constructor(config?: ZApiConfig) {
        this.config = config || {
            instanceId: process.env.ZAPI_INSTANCE_ID!,
            token: process.env.ZAPI_TOKEN!,
            clientToken: process.env.ZAPI_CLIENT_TOKEN,
        };
    }

    private get headers() {
        const headers: any = {};
        if (this.config.clientToken) {
            headers['Client-Token'] = this.config.clientToken;
        }
        return headers;
    }

    private get apiBase() {
        return `${this.baseUrl}/${this.config.instanceId}/token/${this.config.token}`;
    }

    async sendText(phone: string, message: string): Promise<void> {
        if (!this.config.instanceId || !this.config.token) {
            console.warn('⚠️ Z-API Credentials missing');
            return;
        }

        try {
            const cleanPhone = phone.replace(/\D/g, '');
            const url = `${this.apiBase}/send-text`;

            console.log(`📡 Sending Z-API text to ${cleanPhone}...`);

            const response = await axios.post(
                url,
                { phone: cleanPhone, message },
                { headers: this.headers }
            );

            console.log(`✅ Z-API Response: ${JSON.stringify(response.data)}`);
        } catch (error: any) {
            const errorData = error.response ? JSON.stringify(error.response.data) : error.message;
            console.error(`❌ Z-API Failed: ${errorData}`);
        }
    }

    async sendLink(phone: string, linkUrl: string, title?: string): Promise<void> {
        if (!this.config.instanceId || !this.config.token) return;
        try {
            const cleanPhone = phone.replace(/\D/g, '');
            const url = `${this.apiBase}/send-link`;

            console.log(`📡 Sending Z-API link to ${cleanPhone}...`);

            await axios.post(url, {
                phone: cleanPhone,
                message: title || linkUrl,
                image: 'https://cdn-icons-png.flaticon.com/512/281/281769.png',
                linkUrl: linkUrl,
                title: title || 'Link',
                linkDescription: linkUrl
            }, { headers: this.headers });

        } catch (error: any) {
            console.error(`❌ Z-API Link Failed: ${error.message}`);
        }
    }

    async sendLocation(phone: string, lat: number, lng: number, title?: string, address?: string): Promise<void> {
        if (!this.config.instanceId || !this.config.token) return;
        try {
            const cleanPhone = phone.replace(/\D/g, '');
            const url = `${this.apiBase}/send-location`;

            console.log(`📡 Sending Z-API location to ${cleanPhone}...`);

            await axios.post(url, {
                phone: cleanPhone,
                latitude: lat,
                longitude: lng,
                title: title || 'Location',
                address: address || ''
            }, { headers: this.headers });

        } catch (error: any) {
            console.error(`❌ Z-API Location Failed: ${error.message}`);
        }
    }
}

export const zData = new ZApiService();
