import React, { useState, useEffect } from 'react';
import { Quiz, User } from './types';
import { QuizList } from './components/QuizList';
import { QuizEditor } from './components/QuizEditor';
import { QuizPlayer } from './components/QuizPlayer';
import { GoogleSignIn } from './components/GoogleSignIn';
import { getCurrentUser } from './services/auth';
import { apiGetQuiz } from './services/api';
import { addSharedQuizId } from './services/storage';
import { Heart, X, Crown } from 'lucide-react';
import donateImage from './donate.jfif';

type ViewState = 'list' | 'editor' | 'player';

type PremiumProduct = {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  tag?: string;
};

const PREMIUM_PRODUCTS: PremiumProduct[] = [
  {
    id: 'netflix',
    name: 'Netflix Premium',
    price: '89K',
    period: '/tháng',
    features: [
      'Xem Ultra HD 4K mượt mà',
      'Không quảng cáo làm phiền',
      'Tài khoản Shop cấp'
    ]
  },
  {
    id: 'canva',
    name: 'Canva Pro',
    price: '189K',
    period: '/tháng',
    features: [
      'Nâng chính chủ – dùng an toàn',
      'Tặng combo 4 khoá học Canva',
      'Template & công cụ AI không giới hạn'
    ]
  },
  {
    id: 'gdrive',
    name: 'Google Drive + Gemini + NotebookLM',
    price: '349K',
    period: '/năm',
    features: [
      '2TB Google Drive chính chủ',
      'Gemini Advanced + NotebookLM trọn gói',
      'Sao lưu, bảo mật & AI hỗ trợ học tập'
    ]
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('list');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | undefined>(undefined);
  const [user, setUser] = useState<User | null>(null);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPremiumModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold transition-colors shadow-sm"
            >
              <Crown size={18} className="fill-current" />
              Mua dịch vụ Premium
            </button>
            <button
              onClick={() => setShowDonateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-md font-medium transition-colors shadow-sm"
            >
              <Heart size={18} className="fill-current" />
              Donate
            </button>
          </div>
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

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={() => setShowPremiumModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wide mb-1">Tạp Hóa KeyT's workspace</p>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Crown size={26} className="text-yellow-500" />
                    Dịch vụ Premium
                  </h3>
                  <p className="text-gray-500 mt-2">Chọn gói bạn cần, liên hệ Zalo <span className="font-semibold text-gray-800">0868 899 104</span> để mua ngay.</p>
                </div>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors self-start md:self-auto"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {PREMIUM_PRODUCTS.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-xl p-5 bg-gradient-to-b from-white to-gray-50 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xl font-semibold text-gray-900">{product.name}</h4>
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">{product.price}</span>
                      <span className="text-gray-500 font-medium ml-1">{product.period}</span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 mb-6">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => window.open('https://zalo.me/0868899104', '_blank')}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Liên hệ ngay
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
