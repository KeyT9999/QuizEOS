import React, { useState, useEffect } from 'react';
import { Quiz, User } from './types';
import { QuizList } from './components/QuizList';
import { QuizEditor } from './components/QuizEditor';
import { QuizPlayer } from './components/QuizPlayer';
import { GoogleSignIn } from './components/GoogleSignIn';
import { getCurrentUser } from './services/auth';
import { apiGetQuiz } from './services/api';
import { addSharedQuizId } from './services/storage';
import { Heart, X } from 'lucide-react';
import donateImage from './donate.jfif';

type ViewState = 'list' | 'editor' | 'player';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('list');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [showDonateModal, setShowDonateModal] = useState(false);

  useEffect(() => {
    // Check if user is already logged in on mount
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    // Check URL for quiz ID (e.g., /quiz/:id)
    const path = window.location.pathname;
    const quizMatch = path.match(/^\/quiz\/(.+)$/);
    if (quizMatch) {
      const quizId = quizMatch[1];
      loadQuizFromUrl(quizId);
    }
  }, []);

  const loadQuizFromUrl = async (quizId: string) => {
    try {
      console.log('[App] Loading quiz from URL:', quizId, 'User:', user?.id);
      
      // Try to load quiz - public endpoint first, then regular endpoint
      let quiz = null;
      let error: any = null;
      
      try {
        // First try public endpoint (works even without login)
        quiz = await apiGetQuiz(quizId, null);
        console.log('[App] Loaded quiz from public endpoint:', quiz?.title, 'isPublic:', quiz?.isPublic);
      } catch (publicError: any) {
        console.log('[App] Public endpoint failed:', publicError?.message);
        error = publicError;
        
        // If public endpoint fails, try with user ID if logged in
        if (user?.id) {
          try {
            quiz = await apiGetQuiz(quizId, user.id);
            console.log('[App] Loaded quiz from regular endpoint:', quiz?.title, 'isPublic:', quiz?.isPublic);
          } catch (userError: any) {
            console.error('[App] Regular endpoint also failed:', userError?.message);
            error = userError;
          }
        }
      }
      
      if (quiz) {
        // Always add to shared quizzes if quiz exists and is public
        // This allows quiz to show in shared section even if user doesn't own it
        if (quiz.isPublic === true) {
          addSharedQuizId(quizId);
          console.log('[App] Added shared quiz ID:', quizId);
          // Trigger reload of quiz list to show shared quiz
          setTimeout(() => {
            window.dispatchEvent(new Event('quizListReload'));
          }, 500);
        } else {
          console.log('[App] Quiz is not public, not adding to shared:', quizId, 'isPublic:', quiz.isPublic);
        }
        
        setActiveQuiz(quiz);
        setView('player');
        // Update URL without reload
        window.history.pushState({}, '', `/quiz/${quizId}`);
      } else {
        const errorMsg = error?.message || 'Quiz không tìm thấy hoặc không được công khai.';
        console.error('[App] Failed to load quiz:', errorMsg);
        alert(errorMsg);
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('[App] Error loading quiz:', error);
      const errorMsg = error?.message || 'Không thể tải quiz. Vui lòng thử lại.';
      alert(errorMsg);
      window.location.href = '/';
    }
  };

  const handleUserChange = (newUser: User | null) => {
    setUser(newUser);
    // If user logs out, go back to list view
    if (!newUser) {
      setView('list');
      setActiveQuiz(undefined);
    }
  };

  const handleCreate = () => {
    setActiveQuiz(undefined);
    setView('editor');
  };

  const handleEdit = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setView('editor');
  };

  const handlePlay = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setView('player');
  };

  const handleCloseEditor = () => {
    setView('list');
    setActiveQuiz(undefined);
  };

  const handleExitPlayer = () => {
    setView('list');
    setActiveQuiz(undefined);
    // Clear URL when exiting
    window.history.pushState({}, '', '/');
    // Trigger reload of quiz list to show shared quizzes
    window.dispatchEvent(new Event('quizListReload'));
  };

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header with Google Sign In */}
      {view !== 'player' && (
        <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex justify-between items-center shrink-0">
          <button
            onClick={() => setShowDonateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-md font-medium transition-colors shadow-sm"
          >
            <Heart size={18} className="fill-current" />
            Donate
          </button>
          <GoogleSignIn onUserChange={handleUserChange} />
        </div>
      )}
      
      {view === 'list' && (
        <div className="flex-1 overflow-y-auto">
          <QuizList 
            user={user}
            onCreate={handleCreate} 
            onEdit={handleEdit} 
            onPlay={handlePlay} 
          />
        </div>
      )}

      {view === 'editor' && (
        <QuizEditor 
          user={user}
          quizToEdit={activeQuiz} 
          onClose={handleCloseEditor} 
        />
      )}

      {view === 'player' && activeQuiz && (
        <div className="flex-1 p-2 md:p-6 flex flex-col h-full overflow-hidden">
          <QuizPlayer 
            quiz={activeQuiz} 
            onExit={handleExitPlayer} 
          />
        </div>
      )}

      {/* Donate Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDonateModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Donate</h3>
                <button
                  onClick={() => setShowDonateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="text-center mb-4">
                <img 
                  src={donateImage} 
                  alt="Donate" 
                  className="w-full h-auto rounded-lg shadow-md mx-auto"
                />
              </div>
              
              <div className="text-center">
                <p className="text-lg text-gray-700 font-medium">
                  Donate tuiii nếu ní đạt điểm cao trong Final nhoo, xie xieee
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
