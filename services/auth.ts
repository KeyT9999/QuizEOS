import { User } from '../types';

const USER_STORAGE_KEY = 'examflow_user';
const GOOGLE_CLIENT_ID = '149666122656-3897ia650sc9rejq0jno22shsnac03sp.apps.googleusercontent.com';

export const getGoogleClientId = (): string => {
  return GOOGLE_CLIENT_ID;
};

export const getCurrentUser = (): User | null => {
  try {
    const data = localStorage.getItem(USER_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to get current user", e);
    return null;
  }
};

export const saveUser = (user: User): void => {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error("Failed to save user", e);
  }
};

export const clearUser = (): void => {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear user", e);
  }
};

// Initialize Google Identity Services
export const initializeGoogleSignIn = (callback: (user: User) => void): void => {
  if (typeof window === 'undefined' || !(window as any).google) {
    console.error('Google Identity Services not loaded');
    return;
  }

  (window as any).google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response: any) => {
      // Decode the JWT token to get user info
      try {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        const user: User = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture
        };
        saveUser(user);
        callback(user);
      } catch (e) {
        console.error("Failed to decode Google token", e);
      }
    }
  });
};

// Render Google Sign In button
export const renderGoogleSignInButton = (elementId: string): void => {
  if (typeof window === 'undefined' || !(window as any).google) {
    console.error('Google Identity Services not loaded');
    return;
  }

  (window as any).google.accounts.id.renderButton(
    document.getElementById(elementId),
    {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      locale: 'vi'
    }
  );
};

// Prompt Google Sign In
export const promptGoogleSignIn = (): void => {
  if (typeof window === 'undefined' || !(window as any).google) {
    console.error('Google Identity Services not loaded');
    return;
  }

  (window as any).google.accounts.id.prompt();
};

