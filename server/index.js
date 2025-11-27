import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://quiz:ttXyWIieJvQCFMOv@quiz.1hm0ggs.mongodb.net/';
const DB_NAME = 'examflow_quizzer';

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;
let client;

// Connect to MongoDB
async function connectDB() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Initialize database connection
connectDB();

// Quiz Routes
app.get('/api/quizzes', async (req, res) => {
  try {
    const { userId } = req.query;
    const quizzesCollection = db.collection('quizzes');
    
    let query = {};
    if (userId) {
      // Get user's quizzes, demo quizzes, AND public quizzes
      query = { 
        $or: [
          { userId: userId }, 
          { userId: 'demo' },
          { isPublic: true } // Public quizzes visible to all logged-in users
        ] 
      };
    } else {
      // Only demo and public quizzes if no userId
      query = { $or: [{ userId: 'demo' }, { isPublic: true }] };
    }
    
    const quizzes = await quizzesCollection.find(query).sort({ createdAt: -1 }).toArray();
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

app.get('/api/quizzes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // Optional: to check ownership
    const quizzesCollection = db.collection('quizzes');
    
    // Try to find by _id first, then by id field
    let quiz = await quizzesCollection.findOne({ _id: id });
    if (!quiz) {
      quiz = await quizzesCollection.findOne({ id: id });
    }
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Check if quiz is accessible:
    // - If user owns it
    // - If it's public
    // - If it's demo
    const isAccessible = 
      quiz.userId === userId || 
      quiz.isPublic === true || 
      quiz.userId === 'demo';
    
    if (!isAccessible) {
      return res.status(403).json({ error: 'Quiz is private' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Public quiz access (no authentication required)
app.get('/api/quizzes/public/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const quizzesCollection = db.collection('quizzes');
    
    // Only return if quiz is public
    let quiz = await quizzesCollection.findOne({ 
      $or: [
        { _id: id, isPublic: true },
        { id: id, isPublic: true }
      ]
    });
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found or not public' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching public quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

app.post('/api/quizzes', async (req, res) => {
  try {
    const quiz = req.body;
    const quizzesCollection = db.collection('quizzes');
    
    // Generate public URL if quiz is public
    const baseUrl = req.protocol + '://' + req.get('host');
    const publicUrl = quiz.isPublic ? `${baseUrl}/quiz/${quiz.id}` : undefined;
    
    // Convert id to _id for MongoDB if needed
    const quizDoc = {
      ...quiz,
      _id: quiz.id || new ObjectId().toString(),
      createdAt: quiz.createdAt || Date.now(),
      publicUrl: publicUrl
    };
    
    // Check if quiz exists
    const existing = await quizzesCollection.findOne({ _id: quizDoc._id });
    
    if (existing) {
      // Update existing quiz (only if user owns it)
      if (existing.userId !== quiz.userId && existing.userId !== 'demo') {
        return res.status(403).json({ error: 'Permission denied' });
      }
      await quizzesCollection.updateOne(
        { _id: quizDoc._id },
        { $set: quizDoc }
      );
    } else {
      // Insert new quiz
      await quizzesCollection.insertOne(quizDoc);
    }
    
    res.json(quizDoc);
  } catch (error) {
    console.error('Error saving quiz:', error);
    res.status(500).json({ error: 'Failed to save quiz' });
  }
});

app.delete('/api/quizzes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;
    const quizzesCollection = db.collection('quizzes');
    
    // Try to find by _id first, then by id field
    let quiz = await quizzesCollection.findOne({ _id: id });
    if (!quiz) {
      quiz = await quizzesCollection.findOne({ id: id });
    }
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Only allow deletion if user owns the quiz (not demo)
    if (quiz.userId !== userId || quiz.userId === 'demo') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Delete by _id or id
    const deleteResult = await quizzesCollection.deleteOne({ 
      $or: [{ _id: id }, { id: id }] 
    });
    
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Quiz Attempts Routes
app.get('/api/attempts/:quizId', async (req, res) => {
  try {
    const { quizId } = req.params;
    const attemptsCollection = db.collection('attempts');
    const attempts = await attemptsCollection.find({ quizId }).sort({ completedAt: -1 }).toArray();
    res.json(attempts);
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

app.post('/api/attempts', async (req, res) => {
  try {
    const attempt = req.body;
    const attemptsCollection = db.collection('attempts');
    
    const attemptDoc = {
      ...attempt,
      _id: new ObjectId().toString(),
      completedAt: attempt.completedAt || Date.now()
    };
    
    await attemptsCollection.insertOne(attemptDoc);
    res.json(attemptDoc);
  } catch (error) {
    console.error('Error saving attempt:', error);
    res.status(500).json({ error: 'Failed to save attempt' });
  }
});

// User Routes
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: id });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = req.body;
    const usersCollection = db.collection('users');
    
    const userDoc = {
      ...user,
      _id: user.id,
      createdAt: user.createdAt || Date.now()
    };
    
    // Upsert user
    await usersCollection.updateOne(
      { _id: userDoc._id },
      { $set: userDoc },
      { upsert: true }
    );
    
    res.json(userDoc);
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ error: 'Failed to save user' });
  }
});

// Initialize demo quiz
app.post('/api/init-demo', async (req, res) => {
  try {
    const quizzesCollection = db.collection('quizzes');
    const demoQuiz = {
      _id: 'fe-fall-25',
      userId: 'demo',
      title: 'FE FALL 25',
      description: 'Software Testing Foundation Practice Questions',
      createdAt: Date.now(),
      questions: [
        // Add demo questions here if needed
      ]
    };
    
    const existing = await quizzesCollection.findOne({ _id: demoQuiz._id });
    if (!existing) {
      await quizzesCollection.insertOne(demoQuiz);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error initializing demo:', error);
    res.status(500).json({ error: 'Failed to initialize demo' });
  }
});

// Serve frontend build assets
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for non-API routes (support client-side routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});

