import { API_ENDPOINTS } from './../constants/apiEndpoints';
import type { Advertiser } from '../models/advertisement';

export const advertiserService = {
  /**
   * Dispatches the profile payload data securely using the active JWT session token
   */
  async saveAdvertiserProfile(profilePayload: Advertiser): Promise<{ success: boolean; message: string; advertiser: Advertiser | null }> {
    // 1. Fetch the cryptographically signed token context out of cache storage
    const sessionToken = localStorage.getItem('houseilla_token') || '';

    try {
      // 2. Transmit post request out to your dynamic endpoint: http://localhost:8080/api/v1/advertiser
      const response = await fetch(API_ENDPOINTS.SAVE_ADVERTISER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 3. Attach the security token context mapping using standard Bearer structures
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(profilePayload)
      });

      // Handle authorization block errors cleanly
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return { success: false, message: 'Session expired or unauthorized. Please re-verify your OTP.', advertiser: null };
        }
        throw new Error('Server returned an integration pipeline error.');
      }

      const data = await response.json();
      
      // Return the updated data record carrying your auto-generated DB id
      return {
        success: true,
        message: 'Profile saved successfully.',
        advertiser: data || null
      };
    } catch (error) {
      console.error('Secure profile transaction faulted:', error);
      return { success: false, message: 'Failed communicating with backend security filters.', advertiser: null };
    }
  }
};
