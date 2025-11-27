import React, { useEffect, useRef } from 'react';
import { User } from '../types';
import { initializeGoogleSignIn, renderGoogleSignInButton, getCurrentUser, clearUser } from '../services/auth';
import { apiSaveUser, apiCreateWelcomeQuiz, apiGetQuizzes } from '../services/api';
import { LogIn, User as UserIcon, LogOut } from 'lucide-react';

interface GoogleSignInProps {
  onUserChange: (user: User | null) => void;
}

export const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onUserChange }) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      onUserChange(currentUser);
    }

    // Wait for Google Identity Services to load
    const checkGoogleLoaded = () => {
      if (typeof window !== 'undefined' && (window as any).google) {
        initializeGoogleSignIn(async (newUser) => {
          // Save user to MongoDB
          try {
            await apiSaveUser(newUser);
          } catch (error) {
            console.error('Failed to save user to MongoDB:', error);
          }
          
          // Check if user already has quizzes, if not create welcome quiz
          try {
            const existingQuizzes = await apiGetQuizzes(newUser.id);
            const hasWelcomeQuiz = existingQuizzes.some(q => q.id === `welcome-${newUser.id}`);
            
            if (!hasWelcomeQuiz) {
              // Create welcome quiz for new user
              await apiCreateWelcomeQuiz(newUser.id);
            }
          } catch (error) {
            console.error('Failed to create welcome quiz:', error);
          }
          
          setUser(newUser);
          onUserChange(newUser);
        });
        setIsInitialized(true);
      } else {
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    checkGoogleLoaded();
  }, [onUserChange]);

  useEffect(() => {
    if (isInitialized && buttonRef.current && !user) {
      // Clear previous button if exists
      if (buttonRef.current) {
        buttonRef.current.innerHTML = '';
      }
      // Render button only if user is not logged in
      try {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          if (buttonRef.current && !user) {
            renderGoogleSignInButton('google-signin-button');
          }
        }, 100);
      } catch (e) {
        console.error('Failed to render Google Sign In button', e);
      }
    }
  }, [isInitialized, user]);

  const handleSignOut = () => {
    if (typeof window !== 'undefined' && (window as any).google) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
    setUser(null);
    onUserChange(null);
    clearUser();
  };

  if (user) {
    return (
      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
        {user.picture ? (
          <img 
            src={user.picture} 
            alt={user.name || user.email} 
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <UserIcon size={16} className="text-blue-600" />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-gray-800 truncate" title={user.name || user.email}>
            {user.email}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="ml-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-1 shrink-0"
          title="Đăng xuất"
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div id="google-signin-button" ref={buttonRef}></div>
      {!isInitialized && (
        <div className="text-sm text-gray-500">Đang tải Google Sign In...</div>
      )}
    </div>
  );
};

