import React, { useState } from 'react';
import { Quiz, QuizQuestion, OptionLabel, User } from '../types';
import { generateId, saveQuiz, getGeminiApiKey } from '../services/storage';
import { Save, ArrowLeft, Plus, Trash, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ApiKeyDialog } from './ApiKeyDialog';

interface QuizEditorProps {
  user: User | null;
  quizToEdit?: Quiz;
  onClose: () => void;
}

const EMPTY_QUESTION = (): QuizQuestion => {
  const id = generateId();
  return {
    id,
    order: 0,
    prompt: '',
    correctOptionId: `${id}-a`,
    options: [
      { id: `${id}-a`, label: 'A', text: '' },
      { id: `${id}-b`, label: 'B', text: '' },
      { id: `${id}-c`, label: 'C', text: '' },
      { id: `${id}-d`, label: 'D', text: '' },
    ]
  };
};

export const QuizEditor: React.FC<QuizEditorProps> = ({ user, quizToEdit, onClose }) => {
  const [title, setTitle] = useState(quizToEdit?.title || '');
  const [description, setDescription] = useState(quizToEdit?.description || '');
  const [isPublic, setIsPublic] = useState(quizToEdit?.isPublic || false);
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    quizToEdit?.questions || [EMPTY_QUESTION()]
  );
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(
    questions.length > 0 ? questions[0].id : null
  );
  const [rawText, setRawText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | undefined>(undefined);
  const [aiSuggestedQuestions, setAiSuggestedQuestions] = useState<Array<{questionIndex: number, questionText: string, suggestedAnswer: string}>>([]);
  const [showSuggestionAlert, setShowSuggestionAlert] = useState(false);

  const handleAddQuestion = () => {
    const newQ = EMPTY_QUESTION();
    newQ.order = questions.length + 1;
    setQuestions([...questions, newQ]);
    setExpandedQuestionId(newQ.id);
  };

  const handleRemoveQuestion = (id: string) => {
    if (questions.length === 1) return; // Prevent removing last question
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    if (expandedQuestionId === id) {
      setExpandedQuestionId(updated[0].id);
    }
  };

  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const updateOptionText = (qId: string, optId: string, text: string) => {
    setQuestions(qs => qs.map(q => {
      if (q.id !== qId) return q;
      const newOptions = q.options.map(o => o.id === optId ? { ...o, text } : o);
      return { ...q, options: newOptions };
    }));
  };

  const parseTextWithAI = async (text: string): Promise<QuizQuestion[]> => {
    const apiKey = getGeminiApiKey();
    
    if (!apiKey) {
      setShowApiKeyDialog(true);
      setApiKeyError('Vui lòng nhập Gemini API Key để sử dụng tính năng AI');
      throw new Error('API Key required');
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
Bạn là một trợ lý chuyên phân tích và chuyển đổi câu hỏi trắc nghiệm từ text thô sang định dạng JSON.

NHIỆM VỤ:
Phân tích đoạn text sau và trích xuất tất cả các câu hỏi trắc nghiệm. Mỗi câu hỏi có:
- Câu hỏi (prompt)
- 4 đáp án (A, B, C, D)
- Đáp án đúng (chỉ trả về nếu TÌM THẤY trong text, nếu không có thì để null)

ĐỊNH DẠNG TRẢ LỜI (JSON):
Trả về MỘT mảng JSON với format sau (KHÔNG có markdown, chỉ JSON thuần):
[
  {
    "prompt": "Câu hỏi ở đây",
    "options": [
      {"label": "A", "text": "Nội dung đáp án A"},
      {"label": "B", "text": "Nội dung đáp án B"},
      {"label": "C", "text": "Nội dung đáp án C"},
      {"label": "D", "text": "Nội dung đáp án D"}
    ],
    "correctLabel": "A" hoặc "B" hoặc "C" hoặc "D" (CHỈ nếu tìm thấy trong text, nếu không có thì để null)
  }
]

LƯU Ý QUAN TRỌNG:
- CHỈ trả về correctLabel nếu bạn TÌM THẤY đáp án đúng được chỉ định rõ ràng trong text (ví dụ: "Answer: C", "Correct: D", "Đáp án: B", hoặc đáp án được đánh dấu)
- Nếu text KHÔNG có đáp án đúng được chỉ định, để correctLabel là null (KHÔNG đoán, KHÔNG tự chọn)
- Nếu có nhiều đáp án đúng (ví dụ: "A B D"), chọn đáp án đầu tiên làm correctLabel
- Loại bỏ số thứ tự câu hỏi nếu có
- Loại bỏ ký tự đặc biệt không cần thiết
- Giữ nguyên nội dung câu hỏi và đáp án

TEXT CẦN PHÂN TÍCH:
${text}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const responseText = response.text || '';
      
      // Extract JSON from response (remove markdown code blocks if any)
      let jsonText = responseText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(jsonText);
      
      // Convert to QuizQuestion format
      const quizQuestions: QuizQuestion[] = parsed.map((item: any, index: number) => {
        const questionId = generateId();
        const correctLabel = item.correctLabel?.trim().split(' ')[0] || null; // null if no answer provided
        
        const options = item.options.map((opt: any, optIndex: number) => ({
          id: `${questionId}-${opt.label.toLowerCase()}`,
          label: opt.label as OptionLabel,
          text: opt.text.trim()
        }));
        
        // If no correctLabel provided, set to first option as placeholder (will be updated by AI)
        const correctOption = correctLabel 
          ? options.find((opt: any) => opt.label === correctLabel) || options[0]
          : options[0];
        
        return {
          id: questionId,
          order: index + 1,
          prompt: item.prompt.trim(),
          options: options,
          correctOptionId: correctOption.id,
          _needsAnswerSuggestion: !correctLabel // Flag to indicate if AI needs to suggest answer
        };
      });
      
      return quizQuestions;
    } catch (error: any) {
      console.error('Error parsing with AI:', error);
      const errorMessage = error?.message || error?.toString() || '';
      
      if (errorMessage.includes('API') || errorMessage.includes('401') || errorMessage.includes('403')) {
        setApiKeyError('API Key không hợp lệ. Vui lòng nhập lại.');
        setShowApiKeyDialog(true);
        throw new Error('Invalid API Key');
      }
      
      throw new Error('Không thể phân tích text. Vui lòng kiểm tra định dạng và thử lại.');
    }
  };

  const suggestCorrectAnswer = async (question: QuizQuestion): Promise<string | null> => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) return null;

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
Bạn là một trợ lý chuyên phân tích câu hỏi trắc nghiệm và xác định đáp án đúng.

NHIỆM VỤ:
Phân tích câu hỏi trắc nghiệm sau và xác định đáp án đúng (A, B, C, hoặc D).

CÂU HỎI:
${question.prompt}

CÁC ĐÁP ÁN:
${question.options.map(opt => `${opt.label}. ${opt.text}`).join('\n')}

YÊU CẦU:
- Phân tích kỹ câu hỏi và các đáp án
- Xác định đáp án đúng dựa trên kiến thức chuyên môn
- Trả về CHỈ một chữ cái: "A", "B", "C", hoặc "D"
- KHÔNG giải thích, KHÔNG có markdown, chỉ trả về chữ cái đáp án đúng

ĐÁP ÁN ĐÚNG:
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const responseText = response.text?.trim() || '';
      // Extract just the letter (A, B, C, or D)
      const match = responseText.match(/^([ABCD])/i);
      return match ? match[1].toUpperCase() : null;
    } catch (error) {
      console.error('Error suggesting answer:', error);
      return null;
    }
  };

  const handleGenerateFromText = async () => {
    if (!rawText.trim()) {
      alert('Vui lòng nhập hoặc dán text chứa câu hỏi');
      return;
    }

    setIsGenerating(true);
    setAiSuggestedQuestions([]);
    
    try {
      const newQuestions = await parseTextWithAI(rawText);
      
      if (newQuestions.length === 0) {
        alert('Không tìm thấy câu hỏi nào trong text. Vui lòng kiểm tra lại định dạng.');
        setIsGenerating(false);
        return;
      }

      // Check for questions that need answer suggestions
      const questionsNeedingSuggestion = newQuestions.filter((q: any) => q._needsAnswerSuggestion);
      
      if (questionsNeedingSuggestion.length > 0) {
        // Suggest answers for questions without correct answers
        const suggestions: Array<{questionIndex: number, questionText: string, suggestedAnswer: string}> = [];
        
        for (let i = 0; i < questionsNeedingSuggestion.length; i++) {
          const question = questionsNeedingSuggestion[i];
          const suggestedLabel = await suggestCorrectAnswer(question);
          
          if (suggestedLabel) {
            const correctOption = question.options.find((opt: any) => opt.label === suggestedLabel);
            if (correctOption) {
              // Update the question with suggested answer
              const questionIndex = newQuestions.findIndex((q: any) => q.id === question.id);
              if (questionIndex !== -1) {
                newQuestions[questionIndex].correctOptionId = correctOption.id;
                suggestions.push({
                  questionIndex: questions.length + questionIndex + 1,
                  questionText: question.prompt.substring(0, 50) + (question.prompt.length > 50 ? '...' : ''),
                  suggestedAnswer: suggestedLabel
                });
              }
            }
          }
        }
        
        setAiSuggestedQuestions(suggestions);
        if (suggestions.length > 0) {
          setShowSuggestionAlert(true);
        }
      }

      // Remove the temporary flag
      newQuestions.forEach((q: any) => {
        delete q._needsAnswerSuggestion;
      });

      // Add new questions to existing questions
      const updatedQuestions = [...questions, ...newQuestions];
      setQuestions(updatedQuestions);
      setRawText(''); // Clear input
      
      // Expand the first new question
      if (newQuestions.length > 0) {
        setExpandedQuestionId(newQuestions[0].id);
      }
      
      if (questionsNeedingSuggestion.length === 0) {
        alert(`Đã thêm ${newQuestions.length} câu hỏi từ AI!`);
      }
    } catch (error: any) {
      console.error('Generate error:', error);
      if (!error.message.includes('API Key')) {
        alert(error.message || 'Có lỗi xảy ra khi tạo quiz từ AI');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveApiKey = (apiKey: string) => {
    const { saveGeminiApiKey } = require('../services/storage');
    saveGeminiApiKey(apiKey);
    setApiKeyError(undefined);
    // Retry generation after saving API key
    if (rawText.trim()) {
      setTimeout(() => {
        handleGenerateFromText();
      }, 100);
    }
  };

  const handleSave = async () => {
    if (!user) {
      alert('Bạn cần đăng nhập để lưu quiz');
      return;
    }
    
    if (!title.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    const quizId = quizToEdit?.id || generateId();
    // Keep existing isPublic status, don't change it here
    const publicUrl = quizToEdit?.isPublic ? `${window.location.origin}/quiz/${quizId}` : undefined;
    
    const newQuiz: Quiz = {
      id: quizId,
      userId: user.id,
      title,
      description,
      questions,
      createdAt: quizToEdit?.createdAt || Date.now(),
      isPublic: quizToEdit?.isPublic || false, // Keep existing status
      publicUrl: publicUrl
    };
    await saveQuiz(newQuiz, user.id);
    onClose();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold">{quizToEdit ? 'Edit Quiz' : 'Create New Quiz'}</h2>
        </div>
        <button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md shadow flex items-center gap-2"
        >
          <Save size={18} />
          Save Quiz
        </button>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-20">
        {/* Quiz Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="e.g. History Final 2024"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="What is this quiz about?"
              rows={2}
            />
          </div>
          
          {isPublic && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-xs text-green-800 flex items-center gap-1">
                  <span className="font-semibold">✓ Quiz đã được đánh dấu công khai</span>
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Bạn có thể share quiz này từ danh sách quiz bằng nút Share.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* AI Generate Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg shadow-sm border border-purple-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Sparkles size={20} className="text-purple-600" />
            Tạo Quiz Tự Động với AI
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Dán text chứa câu hỏi trắc nghiệm (có câu hỏi, đáp án A/B/C/D, và đáp án đúng). AI sẽ tự động phân tích và thêm vào quiz.
          </p>
          <div className="space-y-3">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Dán text chứa câu hỏi trắc nghiệm ở đây...&#10;&#10;Ví dụ:&#10;Which of the following is NOT a benefit?&#10;A. Option A&#10;B. Option B&#10;C. Option C&#10;D. Option D&#10;D"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono text-sm"
              rows={8}
              disabled={isGenerating}
            />
            <button
              onClick={handleGenerateFromText}
              disabled={isGenerating || !rawText.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white px-6 py-2 rounded-md font-semibold text-sm transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang phân tích với AI...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Tạo Câu Hỏi Từ AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700">Questions ({questions.length})</h3>
            <button
              onClick={handleAddQuestion}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <Plus size={16} /> Add Question
            </button>
          </div>

          {questions.map((q, idx) => {
            const isExpanded = expandedQuestionId === q.id;
            return (
              <div key={q.id} className={`bg-white rounded-lg shadow-sm border transition-all ${isExpanded ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'}`}>
                {/* Question Header */}
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                >
                  <div className="font-medium text-gray-800">
                    <span className="text-gray-400 mr-2">#{idx + 1}</span>
                    {q.prompt || <span className="text-gray-400 italic">Empty question prompt...</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveQuestion(q.id); }}
                      className="text-gray-400 hover:text-red-500 p-1"
                      disabled={questions.length === 1}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded Editor */}
                {isExpanded && (
                  <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Question Text</label>
                      <textarea
                        value={q.prompt}
                        onChange={e => updateQuestion(q.id, { prompt: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-white"
                        rows={2}
                        placeholder="Enter the question here..."
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Answer Options</label>
                      {q.options.map((opt) => (
                        <div key={opt.id} className="flex items-center gap-3">
                          <div
                            onClick={() => updateQuestion(q.id, { correctOptionId: opt.id })}
                            className={`
                              w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer shrink-0 transition-colors
                              ${q.correctOptionId === opt.id ? 'bg-green-600 text-white' : 'bg-white border border-gray-300 text-gray-500 hover:border-gray-400'}
                            `}
                            title="Click to mark as correct answer"
                          >
                            {opt.label}
                          </div>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => updateOptionText(q.id, opt.id, e.target.value)}
                            className={`flex-1 p-2 border rounded focus:outline-none ${q.correctOptionId === opt.id ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white'}`}
                            placeholder={`Option ${opt.label} text`}
                          />
                          {q.correctOptionId === opt.id && <CheckCircle size={16} className="text-green-600" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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

      {/* AI Suggestion Alert */}
      {showSuggestionAlert && aiSuggestedQuestions.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Sparkles size={20} className="text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">AI đã đề xuất đáp án</h3>
                  <p className="text-sm text-gray-600">Vui lòng kiểm tra lại các đáp án sau:</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                {aiSuggestedQuestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {suggestion.questionIndex}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 mb-1">
                          {suggestion.questionText}
                        </p>
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold">Đáp án AI đề xuất:</span> <span className="text-yellow-700 font-bold">{suggestion.suggestedAnswer}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Lưu ý:</span> Đáp án do AI đề xuất có thể không chính xác 100%. 
                  Vui lòng kiểm tra lại từng câu hỏi và điều chỉnh đáp án đúng nếu cần.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowSuggestionAlert(false);
                    setAiSuggestedQuestions([]);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                >
                  Đã hiểu, tôi sẽ kiểm tra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
