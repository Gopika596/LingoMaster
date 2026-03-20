import React, { useState, useEffect } from 'react';
import { Book, GraduationCap, ArrowRight, CheckCircle2, XCircle, RefreshCw, Loader2, ChevronRight, ChevronLeft, Trophy } from 'lucide-react';
import { VocabularyWord, QuizQuestion, UserConfig, Message } from '../types';
import { geminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface VocabularyModeProps {
  config: UserConfig;
  conversationHistory: Message[];
  onBack: () => void;
}

export const VocabularyMode: React.FC<VocabularyModeProps> = ({ config, conversationHistory, onBack }) => {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'learning' | 'quiz' | 'results'>('learning');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizResults, setQuizResults] = useState<{ correct: number; total: number } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const generatedWords = await geminiService.generateVocabulary(config.scenario, config.nativeLanguage, conversationHistory);
      setWords(generatedWords);
      const generatedQuiz = await geminiService.generateQuiz(generatedWords, config.nativeLanguage);
      setQuestions(generatedQuiz);
    } catch (err: any) {
      setError(err.message || "Failed to load vocabulary content.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setStep('quiz');
    }
  };

  const handlePrevWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1);
    }
  };

  const handleAnswerQuiz = (answer: string) => {
    if (showExplanation) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    setQuizAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      calculateResults();
    }
  };

  const calculateResults = () => {
    let correct = 0;
    questions.forEach(q => {
      if (quizAnswers[q.id]?.toLowerCase() === q.correctAnswer.toLowerCase()) {
        correct++;
      }
    });
    setQuizResults({ correct, total: questions.length });
    setStep('results');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Preparing your vocabulary lesson...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-6 text-center">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Oops! Something went wrong</h3>
        <p className="text-slate-600 mb-6">{error}</p>
        <button 
          onClick={loadContent}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
        >
          <RefreshCw className="w-5 h-5" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between glass-card border-b-0 rounded-b-3xl mx-2 mt-2 sm:mx-4 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            {step === 'learning' ? <Book className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase">
              {step === 'learning' ? 'Vocabulary Learning' : step === 'quiz' ? 'Knowledge Check' : 'Results'}
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              {step === 'learning' ? `Word ${currentWordIndex + 1} of ${words.length}` : 
               step === 'quiz' ? `Question ${currentQuestionIndex + 1} of ${questions.length}` : 
               'Mastery Achieved'}
            </p>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="text-xs font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-wider transition-colors"
        >
          Exit
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center justify-center z-10">
        <AnimatePresence mode="wait">
          {step === 'learning' && (
            <motion.div 
              key={`word-${currentWordIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-2xl"
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-indigo-900/5 border border-slate-100 flex flex-col gap-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest rounded-full mb-2 inline-block">
                      New Word
                    </span>
                    <h1 className="text-4xl font-black text-slate-900 mb-1">{words[currentWordIndex].word}</h1>
                    <p className="text-lg font-medium text-indigo-600 italic">{words[currentWordIndex].translation}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Definition</h4>
                    <p className="text-slate-700 leading-relaxed">{words[currentWordIndex].definition}</p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Example Usage</h4>
                    <p className="text-slate-800 font-medium italic">"{words[currentWordIndex].example}"</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button 
                    onClick={handlePrevWord}
                    disabled={currentWordIndex === 0}
                    className={`p-3 rounded-full transition-all ${currentWordIndex === 0 ? 'text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'}`}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  
                  <button 
                    onClick={handleNextWord}
                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                  >
                    {currentWordIndex === words.length - 1 ? 'Start Quiz' : 'Next Word'}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'quiz' && (
            <motion.div 
              key={`quiz-${currentQuestionIndex}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-2xl"
            >
              <div className="bg-white rounded-3xl p-8 shadow-xl shadow-indigo-900/5 border border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6">{questions[currentQuestionIndex].question}</h3>
                
                <div className="space-y-3">
                  {questions[currentQuestionIndex].type === 'multiple-choice' ? (
                    questions[currentQuestionIndex].options?.map((option, idx) => {
                      const isSelected = quizAnswers[questions[currentQuestionIndex].id] === option;
                      const isCorrect = option === questions[currentQuestionIndex].correctAnswer;
                      
                      let variantClass = "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30";
                      if (showExplanation) {
                        if (isCorrect) variantClass = "border-green-500 bg-green-50 text-green-700";
                        else if (isSelected) variantClass = "border-red-500 bg-red-50 text-red-700";
                        else variantClass = "opacity-50 border-slate-100";
                      } else if (isSelected) {
                        variantClass = "border-indigo-600 bg-indigo-50 text-indigo-700";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswerQuiz(option)}
                          disabled={showExplanation}
                          className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all flex items-center justify-between ${variantClass}`}
                        >
                          <span>{option}</span>
                          {showExplanation && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                          {showExplanation && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="space-y-4">
                      <input 
                        type="text"
                        placeholder="Type your answer..."
                        disabled={showExplanation}
                        className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 focus:ring-0 font-medium"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAnswerQuiz(e.currentTarget.value);
                        }}
                      />
                      {showExplanation && (
                        <div className={`p-4 rounded-2xl border-2 ${quizAnswers[questions[currentQuestionIndex].id]?.toLowerCase() === questions[currentQuestionIndex].correctAnswer.toLowerCase() ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'}`}>
                          <p className="font-bold">Correct Answer: {questions[currentQuestionIndex].correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {showExplanation && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100"
                  >
                    <p className="text-sm text-indigo-800 leading-relaxed">
                      <span className="font-bold">Explanation:</span> {questions[currentQuestionIndex].explanation}
                    </p>
                    <button 
                      onClick={handleNextQuestion}
                      className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                    >
                      {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {step === 'results' && quizResults && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center"
            >
              <div className="bg-white rounded-3xl p-10 shadow-xl shadow-indigo-900/5 border border-slate-100">
                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mx-auto mb-6">
                  <Trophy className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Great Job!</h2>
                <p className="text-slate-600 mb-8">You've completed the vocabulary practice for this scenario.</p>
                
                <div className="bg-slate-50 rounded-2xl p-6 mb-8">
                  <div className="text-5xl font-black text-indigo-600 mb-1">{Math.round((quizResults.correct / quizResults.total) * 100)}%</div>
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Mastery Score</div>
                  <div className="mt-4 text-slate-600 font-medium">
                    You got {quizResults.correct} out of {quizResults.total} correct!
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={onBack}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                  >
                    Back to Chat
                  </button>
                  <button 
                    onClick={() => {
                      setStep('learning');
                      setCurrentWordIndex(0);
                      setCurrentQuestionIndex(0);
                      setQuizAnswers({});
                      setQuizResults(null);
                      setShowExplanation(false);
                    }}
                    className="w-full py-4 bg-white text-indigo-600 border-2 border-indigo-100 rounded-2xl font-bold hover:bg-indigo-50 transition-all"
                  >
                    Review Again
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-50 via-white to-slate-50 opacity-80 pointer-events-none"></div>
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-[60px] animate-float pointer-events-none"></div>
    </div>
  );
};
