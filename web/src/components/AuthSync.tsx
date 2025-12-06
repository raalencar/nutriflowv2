import { useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { setAuthToken } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export function AuthSync() {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    useEffect(() => {
        const syncToken = async () => {
            try {
                const token = await getToken();
                setAuthToken(token);
                // Invalidate queries to ensure we fetch fresh data with the new token
                // This recovers from any 401s that happened before token was ready.
                // We invalidate all 'root' queries effectively.
                queryClient.invalidateQueries();
            } catch (error) {
                console.error("Failed to get token", error);
                setAuthToken(null);
            }
        };

        // Sync initially
        syncToken();

        // Set up an interval or simpler mechanism if token rotation is needed 
        // (Clerk handles rotation but getToken() should be called freshly. 
        // Ideally we intercept requests but this is a simple sync).
        // For better results, we can just set it once and let getToken handle it? 
        // No, we need to update the var. 
        // Actually, if we use interval it's safer for expiration.
        const interval = setInterval(syncToken, 50 * 1000); // Check every 50s

        return () => clearInterval(interval);
    }, [getToken]);

    return null;
}
