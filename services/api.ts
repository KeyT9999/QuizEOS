const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Quiz API
export const apiGetQuizzes = async (userId?: string | null): Promise<any[]> => {
  try {
    const url = userId ? `${API_BASE_URL}/quizzes?userId=${userId}` : `${API_BASE_URL}/quizzes`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch quizzes');
    const data = await response.json();
    // Convert _id to id for frontend compatibility
    return data.map((quiz: any) => ({
      ...quiz,
      id: quiz._id || quiz.id
    }));
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    // Fallback to localStorage if API fails
    return [];
  }
};

export const apiGetQuiz = async (id: string, userId?: string | null): Promise<any> => {
  try {
    // Try public endpoint first (no auth required)
    let url = `${API_BASE_URL}/quizzes/public/${id}`;
    let response = await fetch(url);
    
    // If public endpoint fails, try regular endpoint with userId
    if (!response.ok && userId) {
      url = `${API_BASE_URL}/quizzes/${id}?userId=${userId}`;
      response = await fetch(url);
    } else if (!response.ok && !userId) {
      // If no userId, try regular endpoint anyway
      url = `${API_BASE_URL}/quizzes/${id}`;
      response = await fetch(url);
    }
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Quiz not found');
      } else if (response.status === 403) {
        throw new Error('Quiz is private. Please login to access.');
      }
      throw new Error('Failed to fetch quiz');
    }
    
    const data = await response.json();
    return {
      ...data,
      id: data._id || data.id
    };
  } catch (error) {
    console.error('Error fetching quiz:', error);
    throw error;
  }
};

export const apiSaveQuiz = async (quiz: any, userId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/quizzes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...quiz,
        userId
      })
    });
    if (!response.ok) throw new Error('Failed to save quiz');
    const data = await response.json();
    return {
      ...data,
      id: data._id || data.id
    };
  } catch (error) {
    console.error('Error saving quiz:', error);
    throw error;
  }
};

export const apiDeleteQuiz = async (id: string, userId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/quizzes/${id}?userId=${userId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete quiz');
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
};

// Attempt API
export const apiGetQuizAttempts = async (quizId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/attempts/${quizId}`);
    if (!response.ok) throw new Error('Failed to fetch attempts');
    const data = await response.json();
    return data.map((attempt: any) => ({
      ...attempt,
      id: attempt._id || attempt.id
    }));
  } catch (error) {
    console.error('Error fetching attempts:', error);
    return [];
  }
};

export const apiSaveAttempt = async (attempt: any): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/attempts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(attempt)
    });
    if (!response.ok) throw new Error('Failed to save attempt');
    const data = await response.json();
    return {
      ...data,
      id: data._id || data.id
    };
  } catch (error) {
    console.error('Error saving attempt:', error);
    throw error;
  }
};

// User API
export const apiSaveUser = async (user: any): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)
    });
    if (!response.ok) throw new Error('Failed to save user');
    const data = await response.json();
    return {
      ...data,
      id: data._id || data.id
    };
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

// Create welcome quiz for new user
export const apiCreateWelcomeQuiz = async (userId: string): Promise<any> => {
  try {
    const welcomeQuiz = {
      id: `welcome-${userId}`,
      userId: userId,
      title: 'Chào mừng bạn đến với ExamFlow Quizzer!',
      description: 'Quiz mẫu để bạn làm quen với hệ thống. Hãy thử tạo quiz của riêng bạn!',
      createdAt: Date.now(),
      questions: [
        {
          id: 'wq1',
          order: 1,
          prompt: 'ExamFlow Quizzer là gì?',
          correctOptionId: 'wq1-a',
          options: [
            { id: 'wq1-a', label: 'A', text: 'Một ứng dụng tạo và làm quiz trực tuyến' },
            { id: 'wq1-b', label: 'B', text: 'Một trình duyệt web' },
            { id: 'wq1-c', label: 'C', text: 'Một công cụ chỉnh sửa ảnh' },
            { id: 'wq1-d', label: 'D', text: 'Một ứng dụng nhắn tin' },
          ]
        },
        {
          id: 'wq2',
          order: 2,
          prompt: 'Bạn có thể làm gì với ExamFlow Quizzer?',
          correctOptionId: 'wq2-d',
          options: [
            { id: 'wq2-a', label: 'A', text: 'Chỉ xem quiz' },
            { id: 'wq2-b', label: 'B', text: 'Chỉ làm quiz' },
            { id: 'wq2-c', label: 'C', text: 'Chỉ tạo quiz' },
            { id: 'wq2-d', label: 'D', text: 'Tạo, chỉnh sửa và làm quiz' },
          ]
        },
        {
          id: 'wq3',
          order: 3,
          prompt: 'Tính năng "Hỏi Gemini" giúp bạn làm gì?',
          correctOptionId: 'wq3-a',
          options: [
            { id: 'wq3-a', label: 'A', text: 'Nhận giải thích chi tiết về câu hỏi từ AI' },
            { id: 'wq3-b', label: 'B', text: 'Tìm kiếm trên Google' },
            { id: 'wq3-c', label: 'C', text: 'Gửi email' },
            { id: 'wq3-d', label: 'D', text: 'Chơi game' },
          ]
        }
      ]
    };

    return await apiSaveQuiz(welcomeQuiz, userId);
  } catch (error) {
    console.error('Error creating welcome quiz:', error);
    throw error;
  }
};

