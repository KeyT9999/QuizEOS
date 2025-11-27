import React, { useState, useEffect } from 'react';
import { Quiz, QuizAttempt } from '../types';
import { Check, X, Sparkles, Loader2, XCircle, CheckCircle2, Zap, Key } from 'lucide-react';
import { saveAttempt, getGeminiApiKey, saveGeminiApiKey, clearGeminiApiKey } from '../services/storage';
import { GoogleGenAI } from "@google/genai";
import { ApiKeyDialog } from './ApiKeyDialog';

interface QuizPlayerProps {
  quiz: Quiz;
  onExit: () => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // QuestionId -> OptionId
  const [checkedQuestions, setCheckedQuestions] = useState<Set<string>>(new Set()); // Track checked questions
  const [isFinished, setIsFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<{score: number, total: number} | null>(null);
  const [instantFeedback, setInstantFeedback] = useState(false);
  
  // Gemini State
  const [geminiData, setGeminiData] = useState<{loading: boolean, text: string | null, visible: boolean}>({
    loading: false,
    text: null,
    visible: false
  });
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | undefined>(undefined);

  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;
  const isCurrentChecked = checkedQuestions.has(currentQuestion.id);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished || geminiData.visible) return;
      
      switch(e.key) {
        case '1':
        case 'a':
        case 'A':
          if (!isCurrentChecked && currentQuestion.options[0]) handleOptionSelect(currentQuestion.options[0].id);
          break;
        case '2':
        case 'b':
        case 'B':
          if (!isCurrentChecked && currentQuestion.options[1]) handleOptionSelect(currentQuestion.options[1].id);
          break;
        case '3':
        case 'c':
        case 'C':
          if (!isCurrentChecked && currentQuestion.options[2]) handleOptionSelect(currentQuestion.options[2].id);
          break;
        case '4':
        case 'd':
        case 'D':
          if (!isCurrentChecked && currentQuestion.options[3]) handleOptionSelect(currentQuestion.options[3].id);
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) prevQuestion();
          break;
        case 'ArrowRight':
          if (currentIndex < totalQuestions - 1) nextQuestion();
          break;
        case 'Enter':
          if (!isCurrentChecked && answers[currentQuestion.id] && !instantFeedback) {
             handleCheckAnswer();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFinished, currentQuestion, geminiData.visible, isCurrentChecked, answers, instantFeedback]);

  const handleOptionSelect = (optionId: string) => {
    if (isCurrentChecked) return; // Prevent changing answer after checking
    
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionId
    }));

    if (instantFeedback) {
      setCheckedQuestions(prev => new Set(prev).add(currentQuestion.id));
    }
  };

  const handleCheckAnswer = () => {
    if (!answers[currentQuestion.id]) {
      alert("Please select an answer to check.");
      return;
    }
    setCheckedQuestions(prev => new Set(prev).add(currentQuestion.id));
  };

  const nextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleAskGemini = async () => {
    // Check if API key exists
    let apiKey = getGeminiApiKey();
    
    if (!apiKey) {
      // Show dialog to enter API key
      setShowApiKeyDialog(true);
      return;
    }

    setGeminiData({ loading: true, text: null, visible: true });
    
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const correctOpt = currentQuestion.options.find(o => o.id === currentQuestion.correctOptionId);
        
        const prompt = `
Bạn là một trợ giảng chuyên gia với kiến thức sâu rộng về mọi lĩnh vực (khoa học, toán học, lịch sử, văn học, công nghệ, y học, kinh tế, v.v.).
Hãy giải thích câu hỏi trắc nghiệm sau đây bằng Tiếng Việt một cách chi tiết và dễ hiểu.

YÊU CẦU ĐỊNH DẠNG TRẢ LỜI CỤ THỂ (Bắt buộc tuân thủ):
Hãy bắt đầu câu trả lời bằng chính xác câu: "Chào bạn, đây là giải thích chi tiết cho câu hỏi:"

Sau đó trình bày theo 3 phần rõ ràng:

1. Dịch đề và đáp án
Đề bài: [Ghi lại đề bài] ([Dịch đề bài sang tiếng Việt nếu cần])
Các lựa chọn:
[Label]. [Nội dung] ([Dịch sang tiếng Việt nếu cần])
... (liệt kê hết 4 đáp án)

2. Đáp án đúng
[Label của đáp án đúng]. [Nội dung của đáp án đúng]

3. Giải thích kiến thức và tại sao chọn
- Giải thích kiến thức cốt lõi liên quan đến câu hỏi (áp dụng kiến thức từ lĩnh vực phù hợp).
- Phân tích chi tiết tại sao đáp án đúng là chính xác.
- Phân tích ngắn gọn tại sao các đáp án còn lại sai hoặc không phù hợp.

Lưu ý: Hãy xác định lĩnh vực của câu hỏi và sử dụng kiến thức chuyên môn phù hợp để giải thích.

THÔNG TIN CÂU HỎI:
Question: "${currentQuestion.prompt}"
Options:
${currentQuestion.options.map(o => `${o.label}. ${o.text}`).join('\n')}
Correct Answer: ${correctOpt?.label}. ${correctOpt?.text}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        
        setGeminiData({ loading: false, text: response.text || "Không có phản hồi.", visible: true });

    } catch (e: any) {
        console.error(e);
        
        // Check if error is related to API key
        const errorMessage = e?.message || e?.toString() || '';
        const isApiKeyError = 
          errorMessage.includes('API_KEY') || 
          errorMessage.includes('API key') ||
          errorMessage.includes('401') ||
          errorMessage.includes('403') ||
          errorMessage.includes('Invalid API key') ||
          errorMessage.includes('authentication');
        
        if (isApiKeyError) {
          // API key is invalid, show dialog to re-enter
          setGeminiData({ loading: false, text: null, visible: false });
          setApiKeyError('API Key không hợp lệ hoặc đã hết hạn. Vui lòng nhập lại API Key của bạn.');
          setShowApiKeyDialog(true);
          // Clear the invalid API key
          clearGeminiApiKey();
        } else {
          // Other error
          setGeminiData({ 
            loading: false, 
            text: "Xin lỗi, hiện tại không thể kết nối với Gemini. Vui lòng kiểm tra API Key hoặc thử lại sau.", 
            visible: true 
          });
        }
    }
  };

  const handleSaveApiKey = (apiKey: string) => {
    saveGeminiApiKey(apiKey);
    setApiKeyError(undefined); // Clear error message
    // After saving, try asking Gemini again
    setTimeout(() => {
      handleAskGemini();
    }, 100);
  };

  const finishQuiz = async () => {
    // 1. Calculate Score First
    let correctCount = 0;
    quiz.questions.forEach(q => {
      const selectedOptionId = answers[q.id];
      // Strict check ensures we match the correct ID
      if (selectedOptionId && selectedOptionId === q.correctOptionId) {
        correctCount++;
      }
    });

    // 2. Check for unanswered questions
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = totalQuestions - answeredCount;

    // Only prompt if there are missing answers
    if (unansweredCount > 0) {
      if (!window.confirm(`You have ${unansweredCount} unanswered questions. Do you want to submit anyway?`)) {
        return; // User cancelled
      }
    }

    // 3. Save Attempt
    try {
      const attempt: QuizAttempt = {
        quizId: quiz.id,
        answers: answers,
        score: correctCount,
        total: totalQuestions,
        completedAt: Date.now()
      };
      await saveAttempt(attempt);
      console.log('Attempt saved:', attempt);
    } catch (error) {
      console.error('Error saving attempt:', error);
    }

    // 4. Show results
    setFinalScore({ score: correctCount, total: totalQuestions });
    setIsFinished(true);
  };

  if (isFinished && finalScore) {
    const { score, total } = finalScore;
    const percentage = Math.round((score / total) * 100);
    
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 w-full h-full overflow-y-auto">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Exam Results</h2>
          <div className={`text-6xl font-bold mb-4 ${percentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
            {percentage}%
          </div>
          <p className="text-xl text-gray-600 mb-8">
            You answered {score} out of {total} questions correctly.
          </p>
          
          <button 
            onClick={onExit}
            type="button"
            className="bg-blue-900 text-white px-8 py-3 rounded-md hover:bg-blue-800 transition-colors font-semibold shadow-md"
          >
            Back to Quiz List
          </button>
        </div>

        <div className="mt-8 space-y-4 pb-10">
            <h3 className="text-xl font-bold text-gray-700 border-b pb-2">Detailed Review</h3>
            {quiz.questions.map((q, idx) => {
                const userAnswerId = answers[q.id];
                const isCorrect = userAnswerId === q.correctOptionId;
                const correctOption = q.options.find(o => o.id === q.correctOptionId);
                const userOption = q.options.find(o => o.id === userAnswerId);

                return (
                    <div key={q.id} className={`p-5 rounded-md border-l-4 shadow-sm ${isCorrect ? 'border-green-500 bg-white' : 'border-red-500 bg-white'}`}>
                         <div className="flex items-start gap-3">
                             <div className="mt-1 shrink-0">
                               {isCorrect ? <Check className="text-green-500" size={24}/> : <X className="text-red-500" size={24}/>}
                             </div>
                             <div className="flex-1">
                                 <p className="font-bold text-gray-800 text-lg mb-2">Question {idx+1}: {q.prompt}</p>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className={`p-3 rounded ${isCorrect ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                                        <span className="block text-xs font-bold uppercase opacity-70 mb-1">Your Answer</span>
                                        <span className={isCorrect ? "text-green-800 font-medium" : "text-red-800 font-medium"}>
                                          {userOption ? `${userOption.label}. ${userOption.text}` : "(No answer selected)"}
                                        </span>
                                    </div>
                                    
                                    {!isCorrect && (
                                      <div className="p-3 rounded bg-gray-50 border border-gray-100">
                                          <span className="block text-xs font-bold text-gray-500 uppercase opacity-70 mb-1">Correct Answer</span>
                                          <span className="text-gray-800 font-medium">
                                            {correctOption?.label}. {correctOption?.text}
                                          </span>
                                      </div>
                                    )}
                                 </div>
                             </div>
                         </div>
                    </div>
                )
            })}
        </div>
      </div>
    );
  }

  // --- Main Player Layout ---
  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto bg-white shadow-2xl border border-gray-300 rounded-sm overflow-hidden my-2 md:my-6">
      {/* Top Header */}
      <div className="bg-gray-100 border-b border-gray-300 p-2 flex justify-between items-center h-10 shrink-0">
         <span className="font-bold text-sm text-blue-900 px-2 truncate flex-1">{quiz.title}</span>
         
         <div className="flex items-center gap-4">
             <label className="flex items-center gap-1.5 cursor-pointer select-none bg-white px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm" title="Automatically check answer upon selection">
                <input 
                    type="checkbox" 
                    checked={instantFeedback} 
                    onChange={(e) => setInstantFeedback(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Zap size={12} className={instantFeedback ? "text-yellow-500 fill-yellow-500" : "text-gray-400"} />
                    Instant Feedback
                </span>
             </label>
             <button 
                onClick={onExit} 
                type="button"
                className="text-xs text-gray-500 hover:text-red-600 px-2 font-medium flex items-center gap-1"
             >
                Quit (No Save)
             </button>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel: Answer Selection */}
        <div className="w-[28%] min-w-[220px] max-w-[350px] bg-white flex flex-col h-full relative z-10">
          
          <div className="p-3 border-b border-gray-200">
            <h2 className="text-blue-800 font-bold text-sm uppercase">Answer</h2>
            <p className="text-xs text-gray-500">(Choose 1 answer)</p>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((opt) => {
                 const isSelected = answers[currentQuestion.id] === opt.id;
                 const isCorrect = opt.id === currentQuestion.correctOptionId;
                 
                 // Style determination
                 let labelClass = "text-gray-700";
                 let bgClass = "bg-white border-gray-400";

                 if (isCurrentChecked) {
                    if (isCorrect) {
                        // It's correct, show Green
                        labelClass = "text-green-600 font-bold";
                        bgClass = "border-green-600 bg-white";
                        if (isSelected) {
                            bgClass = "border-green-600 bg-green-600"; // Filled green if selected correct
                        }
                    } else if (isSelected) {
                        // It's wrong and selected, show Red
                        labelClass = "text-red-600 font-bold line-through";
                        bgClass = "border-red-600 bg-red-600"; 
                    } else {
                        // Unselected wrong options, fade them a bit
                        labelClass = "text-gray-400";
                        bgClass = "bg-gray-100 border-gray-300";
                    }
                 } else {
                    // Normal mode
                    if (isSelected) {
                        labelClass = "text-blue-600";
                        bgClass = "bg-blue-600 border-blue-600";
                    }
                 }

                 return (
                  <label 
                    key={opt.id} 
                    className={`flex items-center gap-3 cursor-pointer group select-none ${isCurrentChecked ? 'cursor-default' : ''}`}
                  >
                    <div className="relative">
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        checked={isSelected}
                        onChange={() => handleOptionSelect(opt.id)}
                        disabled={isCurrentChecked}
                        className="peer sr-only"
                      />
                      <div className={`
                        w-5 h-5 border rounded-sm
                        flex items-center justify-center transition-colors
                        ${bgClass}
                      `}>
                         {/* Show dot or check/x icon? Simplest is a white dot or keep radio style */}
                         {isSelected && !isCurrentChecked && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                         {isCurrentChecked && isCorrect && <Check size={14} className="text-green-100" />}
                         {isCurrentChecked && isSelected && !isCorrect && <X size={14} className="text-white" />}
                      </div>
                    </div>
                    <span className={`text-sm font-medium transition-colors ${labelClass} ${!isCurrentChecked && 'group-hover:text-blue-500'}`}>
                      {opt.label}
                    </span>
                  </label>
                 );
              })}
            </div>
          </div>

          {/* Bottom Navigation Buttons in Left Panel */}
          <div className="p-3 border-t border-gray-200 flex gap-2 bg-gray-50">
            <button
              type="button"
              onClick={prevQuestion}
              disabled={currentIndex === 0}
              className={`
                px-2 md:px-3 py-1.5 rounded text-sm font-medium transition-colors border border-gray-300
                ${currentIndex === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-gray-700'}
              `}
            >
              Back
            </button>
            
            {!instantFeedback && (
                <button
                    type="button"
                    onClick={handleCheckAnswer}
                    disabled={isCurrentChecked}
                    className={`
                        flex-1 px-2 md:px-3 py-1.5 rounded text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-1
                        ${isCurrentChecked 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300' 
                            : 'bg-orange-500 hover:bg-orange-600 text-white border border-orange-600'}
                    `}
                >
                    {isCurrentChecked ? 'Checked' : <><CheckCircle2 size={14}/> Check</>}
                </button>
            )}

            {currentIndex === totalQuestions - 1 ? (
              <button
                type="button"
                onClick={finishQuiz}
                className={`px-2 md:px-3 py-1.5 rounded text-sm font-bold bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 transition-colors shadow-sm ${instantFeedback ? 'flex-1' : ''}`}
              >
                Finish
              </button>
            ) : (
              <button
                type="button"
                onClick={nextQuestion}
                className={`px-2 md:px-3 py-1.5 rounded text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-colors ${instantFeedback ? 'flex-1' : ''}`}
              >
                Next
              </button>
            )}
          </div>
        </div>

        {/* The Red Divider */}
        <div className="w-1.5 bg-red-600 h-full shrink-0 shadow-sm z-20"></div>

        {/* Right Panel: Question & Option Text */}
        <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden relative z-10">
          
          {/* Status Bar */}
          <div className="bg-gray-200 border-b border-gray-300 p-2 text-xs font-semibold text-blue-900 shrink-0">
             There are {totalQuestions} questions, and your progress of answering is {currentIndex + 1}/{totalQuestions}
          </div>

          {/* Question Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-white border border-gray-300 shadow-sm min-h-[300px] flex flex-col">
              {/* Question Text Header */}
              <div className="bg-gray-100 border-b border-gray-300 p-4 flex justify-between items-start gap-4">
                 <h3 className="text-base font-bold text-gray-800 leading-relaxed">
                   {currentQuestion.prompt}
                 </h3>
                 <button 
                    onClick={handleAskGemini}
                    className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow hover:opacity-90 transition-opacity"
                    title="Get detailed explanation from AI"
                 >
                    <Sparkles size={14} /> Hỏi Gemini
                 </button>
              </div>
              
              {/* Option Texts */}
              <div className="p-6 space-y-5">
                 {currentQuestion.options.map((opt) => {
                    const isSelected = answers[currentQuestion.id] === opt.id;
                    const isCorrect = opt.id === currentQuestion.correctOptionId;
                    
                    let rowClass = "";
                    if (isCurrentChecked) {
                        if (isCorrect) rowClass = "bg-green-50 p-2 rounded -mx-2 border border-green-200";
                        else if (isSelected && !isCorrect) rowClass = "bg-red-50 p-2 rounded -mx-2 border border-red-200";
                    }

                    return (
                        <div key={opt.id} className={`text-sm text-gray-800 leading-relaxed flex gap-3 items-start transition-colors ${rowClass}`}>
                        <span className={`
                            font-bold w-6 h-6 flex items-center justify-center rounded text-xs border shrink-0
                            ${isCurrentChecked && isCorrect ? 'bg-green-600 text-white border-green-600' : 
                              isCurrentChecked && isSelected && !isCorrect ? 'bg-red-600 text-white border-red-600' :
                              'text-blue-900 bg-blue-50 border-blue-100'}
                        `}>
                            {opt.label}
                        </span>
                        <span className="mt-0.5">{opt.text}</span>
                        </div>
                    );
                 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Dialog */}
      <ApiKeyDialog
        isOpen={showApiKeyDialog}
        onClose={() => {
          setShowApiKeyDialog(false);
          setApiKeyError(undefined);
        }}
        onSave={handleSaveApiKey}
        errorMessage={apiKeyError}
      />

      {/* Gemini Explanation Modal */}
      {geminiData.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex justify-between items-center shrink-0">
                    <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                        <Sparkles size={20} className="text-yellow-300" /> 
                        Giải thích từ Gemini
                    </h3>
                    <button 
                        onClick={() => setGeminiData(prev => ({...prev, visible: false}))}
                        className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                    >
                        <XCircle size={24} />
                    </button>
                </div>
                
                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 text-gray-800 leading-relaxed">
                    {geminiData.loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 size={48} className="text-purple-600 animate-spin" />
                            <p className="text-gray-500 font-medium animate-pulse">Đang phân tích câu hỏi...</p>
                        </div>
                    ) : geminiData.text?.includes('API Key') || geminiData.text?.includes('API key') ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="text-center space-y-4">
                                <p className="text-red-600 font-semibold text-lg">⚠️ Lỗi API Key</p>
                                <p className="text-gray-700">{geminiData.text}</p>
                                <button
                                    onClick={() => {
                                        setGeminiData(prev => ({...prev, visible: false}));
                                        setShowApiKeyDialog(true);
                                        setApiKeyError('API Key không hợp lệ. Vui lòng nhập lại.');
                                        clearGeminiApiKey();
                                    }}
                                    className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white px-6 py-2 rounded-md font-semibold text-sm transition-opacity flex items-center gap-2 mx-auto"
                                >
                                    <Key size={16} />
                                    Nhập lại API Key
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="whitespace-pre-wrap font-medium text-sm text-gray-700">
                            {geminiData.text}
                        </div>
                    )}
                </div>
                
                {/* Modal Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-end shrink-0">
                    <button 
                        onClick={() => setGeminiData(prev => ({...prev, visible: false}))}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-md font-semibold text-sm transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};