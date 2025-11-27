import React, { useEffect, useState } from 'react';
import { Quiz, User, QuizAttempt } from '../types';
import { getQuizzes, deleteQuiz, getQuizAttempts, saveQuiz, getSharedQuizzes } from '../services/storage';
import { Plus, Play, Edit, Trash2, GraduationCap, Trophy, Share2, Globe, Users } from 'lucide-react';
import { ShareDialog } from './ShareDialog';

interface QuizListProps {
  user: User | null;
  onEdit: (quiz: Quiz) => void;
  onPlay: (quiz: Quiz) => void;
  onCreate: () => void;
}

export const QuizList: React.FC<QuizListProps> = ({ user, onEdit, onPlay, onCreate }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [sharedQuizzes, setSharedQuizzes] = useState<Quiz[]>([]);
  // We will trigger a re-render when quizzes change to update scores too
  const [trigger, setTrigger] = useState(0);
  const [shareDialog, setShareDialog] = useState<{ isOpen: boolean; quiz: Quiz | null }>({
    isOpen: false,
    quiz: null
  });

  const loadQuizzes = async () => {
    console.log('[QuizList] Loading quizzes for user:', user?.id);
    const loadedQuizzes = await getQuizzes(user?.id || null);
    setQuizzes(loadedQuizzes);
    console.log('[QuizList] Loaded', loadedQuizzes.length, 'quizzes');
    
    // Load shared quizzes (pass userId to filter out owned quizzes)
    const shared = await getSharedQuizzes(user?.id || null);
    console.log('[QuizList] Loaded', shared.length, 'shared quizzes');
    
    // Additional filter to ensure no duplicates
    const filteredShared = shared.filter(sq => 
      !loadedQuizzes.some(q => q.id === sq.id)
    );
    console.log('[QuizList] Filtered to', filteredShared.length, 'shared quizzes (after removing duplicates)');
    setSharedQuizzes(filteredShared);
  };

  useEffect(() => {
    loadQuizzes();
  }, [trigger, user]);

  // Listen for reload event from App
  useEffect(() => {
    const handleReload = () => {
      loadQuizzes();
    };
    window.addEventListener('quizListReload', handleReload);
    return () => window.removeEventListener('quizListReload', handleReload);
  }, []);

  const handleDelete = async (id: string) => {
    if (!user) {
      alert('Bạn cần đăng nhập để xóa quiz');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      await deleteQuiz(id, user.id);
      loadQuizzes();
    }
  };

  const handleShare = async (quiz: Quiz) => {
    if (!user) {
      alert('Bạn cần đăng nhập để share quiz');
      return;
    }

    // Check if user owns this quiz
    if (quiz.userId !== user.id) {
      alert('Bạn chỉ có thể share quiz của chính mình');
      return;
    }

    // Auto-enable public if not already public
    if (!quiz.isPublic) {
      try {
        const updatedQuiz: Quiz = {
          ...quiz,
          isPublic: true,
          publicUrl: `${window.location.origin}/quiz/${quiz.id}`
        };
        await saveQuiz(updatedQuiz, user.id);
        // Reload quizzes to get updated data
        await loadQuizzes();
        // Update quiz in state
        const updatedQuizzes = quizzes.map(q => q.id === quiz.id ? updatedQuiz : q);
        setQuizzes(updatedQuizzes);
        // Show share dialog with updated quiz
        setShareDialog({ isOpen: true, quiz: updatedQuiz });
      } catch (error) {
        console.error('Error making quiz public:', error);
        alert('Không thể chia sẻ quiz. Vui lòng thử lại.');
      }
    } else {
      // Already public, just show dialog
      setShareDialog({ isOpen: true, quiz });
    }
  };

  const [attemptsCache, setAttemptsCache] = useState<Record<string, QuizAttempt[]>>({});
  const [sharedAttemptsCache, setSharedAttemptsCache] = useState<Record<string, QuizAttempt[]>>({});

  useEffect(() => {
    // Load attempts for all quizzes
    const loadAttempts = async () => {
      const cache: Record<string, QuizAttempt[]> = {};
      for (const quiz of quizzes) {
        const attempts = await getQuizAttempts(quiz.id);
        cache[quiz.id] = attempts;
      }
      setAttemptsCache(cache);
    };
    if (quizzes.length > 0) {
      loadAttempts();
    }
  }, [quizzes]);

  useEffect(() => {
    // Load attempts for shared quizzes
    const loadSharedAttempts = async () => {
      const cache: Record<string, QuizAttempt[]> = {};
      for (const quiz of sharedQuizzes) {
        const attempts = await getQuizAttempts(quiz.id);
        cache[quiz.id] = attempts;
      }
      setSharedAttemptsCache(cache);
    };
    if (sharedQuizzes.length > 0) {
      loadSharedAttempts();
    }
  }, [sharedQuizzes]);

  const getBestScoreDisplay = (quizId: string, isShared: boolean = false) => {
    const attempts = isShared ? sharedAttemptsCache[quizId] || [] : attemptsCache[quizId] || [];
    if (attempts.length === 0) return null;
    
    const best = attempts.reduce((max, curr) => {
        const currPercent = (curr.score / curr.total) * 100;
        const maxPercent = (max.score / max.total) * 100;
        return currPercent > maxPercent ? curr : max;
    }, attempts[0]);

    const percent = Math.round((best.score / best.total) * 100);
    return (
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${percent >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
         <Trophy size={12} />
         Best: {percent}%
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6 w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            My Quizzes
          </h1>
          <p className="text-gray-500 mt-1">Select a quiz to practice or create a new one.</p>
        </div>
        <button
          onClick={() => {
            if (!user) {
              alert('Bạn cần đăng nhập để tạo quiz mới');
              return;
            }
            onCreate();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!user}
        >
          <Plus size={20} />
          Create New Quiz
        </button>
      </div>

      {/* Shared Quizzes Section */}
      {sharedQuizzes.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800">Quiz Share</h2>
            <span className="text-sm text-gray-500">({sharedQuizzes.length})</span>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Các quiz được chia sẻ từ người khác. Bạn chỉ có thể làm quiz này.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sharedQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-lg shadow-sm border border-purple-200 p-5 hover:shadow-md transition-shadow flex flex-col justify-between h-52"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h3 className="font-bold text-xl text-gray-800 truncate" title={quiz.title}>
                        {quiz.title}
                      </h3>
                      <Globe size={16} className="text-purple-500 shrink-0" title="Quiz được chia sẻ" />
                    </div>
                    {getBestScoreDisplay(quiz.id, true)}
                  </div>
                  
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4 min-h-[40px]">
                    {quiz.description || 'No description provided.'}
                  </p>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {quiz.questions.length} Questions
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                  <button
                    onClick={() => onPlay(quiz)}
                    className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium px-3 py-1.5 rounded hover:bg-green-50 transition-colors"
                    disabled={quiz.questions.length === 0}
                  >
                    <Play size={18} /> Play
                  </button>
                  <span className="text-xs text-gray-400 italic">Chỉ xem</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Quizzes Section */}
      {sharedQuizzes.length > 0 && (
        <div className="flex items-center gap-2 mb-4 mt-8">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">My Quizzes</h2>
          <span className="text-sm text-gray-500">({quizzes.length})</span>
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 text-lg">No quizzes found. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col justify-between h-52"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h3 className="font-bold text-xl text-gray-800 truncate" title={quiz.title}>
                      {quiz.title}
                    </h3>
                    {quiz.isPublic && (
                      <Globe size={16} className="text-blue-500 shrink-0" title="Quiz công khai" />
                    )}
                  </div>
                  {getBestScoreDisplay(quiz.id)}
                </div>
                
                <p className="text-gray-500 text-sm line-clamp-2 mb-4 min-h-[40px]">
                  {quiz.description || 'No description provided.'}
                </p>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {quiz.questions.length} Questions
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                <button
                  onClick={() => onPlay(quiz)}
                  className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium px-3 py-1.5 rounded hover:bg-green-50 transition-colors"
                  disabled={quiz.questions.length === 0}
                >
                  <Play size={18} /> Play
                </button>
                <div className="flex gap-1 items-center">
                  {/* Share button - only for quiz owner */}
                  {user && quiz.userId === user.id && (
                    <button
                      onClick={() => handleShare(quiz)}
                      className="text-gray-500 hover:text-blue-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                      title="Share quiz"
                    >
                      <Share2 size={18} />
                    </button>
                  )}
                  
                  {user && quiz.userId === user.id && (
                    <>
                      <button
                        onClick={() => onEdit(quiz)}
                        className="text-gray-500 hover:text-blue-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(quiz.id)}
                        className="text-gray-500 hover:text-red-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                  {quiz.userId === 'demo' && (
                    <span className="text-xs text-gray-400 px-2">Demo</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Dialog */}
      {shareDialog.quiz && (
        <ShareDialog
          isOpen={shareDialog.isOpen}
          onClose={() => setShareDialog({ isOpen: false, quiz: null })}
          quizId={shareDialog.quiz.id}
          quizTitle={shareDialog.quiz.title}
        />
      )}
    </div>
  );
};
