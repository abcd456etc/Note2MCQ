
import React, { useState, useEffect, useCallback } from 'react';
import type { Note, Question } from '../types';
import { generateQuizFromNotes } from '../services/geminiService';
import { LoaderIcon, ArrowLeftIcon, ArrowRightIcon, BrainIcon } from './Icons';

interface QuizViewProps {
  notes: Note[];
  onBack: () => void;
  onQuizComplete: (quizId: string, questions: Question[], score: number) => void;
}

const QuizView: React.FC<QuizViewProps> = ({ notes, onBack, onQuizComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const fetchQuiz = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const generatedQuestions = await generateQuizFromNotes(notes);
      setQuestions(generatedQuestions);
      setSelectedAnswers(new Array(generatedQuestions.length).fill(null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const handleSelectAnswer = (optionIndex: number) => {
    if (isFinished) return;
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Finish quiz
      let finalScore = 0;
      for (let i = 0; i < questions.length; i++) {
        if (selectedAnswers[i] === questions[i].correctAnswerIndex) {
          finalScore++;
        }
      }
      setScore(finalScore);
      setIsFinished(true);
      onQuizComplete(new Date().toISOString(), questions, finalScore);
    }
  };

  const getOptionClass = (optionIndex: number) => {
    if (!isFinished) {
      return selectedAnswers[currentQuestionIndex] === optionIndex
        ? 'bg-indigo-600 border-indigo-500'
        : 'bg-slate-700 border-slate-600 hover:bg-slate-600';
    }
    // After finishing
    const isCorrect = optionIndex === questions[currentQuestionIndex].correctAnswerIndex;
    const isSelected = optionIndex === selectedAnswers[currentQuestionIndex];

    if (isCorrect) return 'bg-green-700 border-green-500';
    if (isSelected && !isCorrect) return 'bg-red-700 border-red-500';
    return 'bg-slate-700 border-slate-600';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <LoaderIcon className="w-12 h-12 text-indigo-400 animate-spin" />
        <p className="mt-4 text-lg">Generating your personalized quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button onClick={onBack} className="flex items-center bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-lg w-full">
            <h2 className="text-3xl font-bold text-indigo-400 mb-2">Quiz Complete!</h2>
            <p className="text-xl text-slate-300 mb-6">Your Score</p>
            <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-slate-700" strokeWidth="10" stroke="currentColor" fill="transparent" r="56" cx="80" cy="80" />
                    <circle className="text-indigo-500" strokeWidth="10" stroke="currentColor" fill="transparent" r="56" cx="80" cy="80"
                        strokeDasharray={352}
                        strokeDashoffset={352 - (score / questions.length) * 352}
                        style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }} />
                </svg>
                <span className="absolute text-4xl font-bold">{score}/{questions.length}</span>
            </div>
            <p className="text-slate-400 mb-8">You answered {Math.round((score/questions.length)*100)}% of questions correctly.</p>

            <div className="flex space-x-4 justify-center">
                 <button onClick={() => { setIsFinished(false); setCurrentQuestionIndex(0); }} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    Review Answers
                </button>
                <button onClick={onBack} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    Back to Dashboard
                </button>
            </div>
        </div>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <button onClick={onBack} className="flex items-center text-slate-300 hover:text-white transition-colors">
                <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back
            </button>
            <div className="text-lg font-semibold">Question {currentQuestionIndex + 1} of {questions.length}</div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl flex-grow flex flex-col">
            <h2 className="text-xl md:text-2xl font-semibold mb-6 text-slate-100">{currentQuestion.question}</h2>
            
            <div className="space-y-4 flex-grow">
                {currentQuestion.options.map((option, index) => (
                    <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-all duration-200 ${getOptionClass(index)}`}
                    >
                    <span className="font-semibold">{String.fromCharCode(65 + index)}.</span> {option}
                    </button>
                ))}
            </div>

            <div className="mt-8 text-right">
                <button 
                    onClick={handleNext} 
                    disabled={selectedAnswers[currentQuestionIndex] === null}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg flex items-center ml-auto transition-colors"
                >
                    {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
            </div>
        </div>
    </div>
  );
};

export default QuizView;
