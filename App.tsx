
import React, { useState, useCallback } from 'react';
import type { Note, ChatMessage, Quiz, Question, View } from './types';
import { BrainIcon, MessageSquareIcon, CheckSquareIcon, BookOpenIcon, PlusIcon, XIcon, ArrowLeftIcon, TextIcon, ImageIcon } from './components/Icons';
import { NoteUploader } from './components/NoteUploader';
import QuizView from './components/QuizView';
import ChatView from './components/ChatView';

// --- Helper Components defined outside App to prevent re-renders ---
const Header: React.FC = () => (
    <header className="flex items-center p-4 border-b border-slate-800">
        <BrainIcon className="w-8 h-8 text-indigo-400" />
        <h1 className="text-2xl font-bold ml-3 bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
            Note2Brain
        </h1>
    </header>
);

interface DashboardCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    disabled?: boolean;
}
const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, description, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="bg-slate-800 p-6 rounded-2xl text-left hover:bg-slate-700/50 border border-slate-700 hover:border-indigo-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:border-slate-700 group"
    >
        <div className="flex items-center justify-center w-12 h-12 bg-slate-700 group-hover:bg-indigo-600 rounded-lg mb-4 transition-colors duration-300">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
    </button>
);

const App: React.FC = () => {
    const [view, setView] = useState<View>('dashboard');
    const [notes, setNotes] = useState<Note[]>([]);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [quizHistory, setQuizHistory] = useState<Quiz[]>([]);
    const [isUploaderOpen, setIsUploaderOpen] = useState(false);
    const [activeNote, setActiveNote] = useState<Note | null>(null);

    const addNote = (title: string, content: string, type: 'text' | 'image') => {
        const newNote: Note = {
            id: new Date().toISOString(),
            title,
            content,
            createdAt: new Date(),
            type,
        };
        setNotes(prev => [...prev, newNote]);
        setIsUploaderOpen(false);
    };

    const handleNewChatMessage = useCallback((message: ChatMessage) => {
        setChatHistory(prev => {
            const existingIndex = prev.findIndex(m => m.id === message.id);
            if (existingIndex > -1) {
                const updatedHistory = [...prev];
                updatedHistory[existingIndex] = message;
                return updatedHistory;
            }
            return [...prev, message];
        });
    }, []);

    const handleQuizComplete = useCallback((quizId: string, questions: Question[], score: number) => {
        const newQuiz: Quiz = {
            id: quizId,
            questions,
            createdAt: new Date(),
            score,
        };
        setQuizHistory(prev => [newQuiz, ...prev]);
    }, []);

    const deleteNote = (noteId: string) => {
        setNotes(notes.filter(note => note.id !== noteId));
    };

    const renderView = () => {
        if (activeNote) {
            return (
                <div className="p-4 md:p-8 h-full flex flex-col">
                    <button onClick={() => setActiveNote(null)} className="flex items-center text-slate-300 hover:text-white transition-colors mb-4 self-start">
                        <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back to Dashboard
                    </button>
                    <div className="bg-slate-800 p-6 rounded-2xl flex-grow overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">{activeNote.title}</h2>
                        <p className="text-slate-300 whitespace-pre-wrap">{activeNote.content}</p>
                    </div>
                </div>
            );
        }
        
        switch (view) {
            case 'chat':
                return <ChatView notes={notes} chatHistory={chatHistory} onNewMessage={handleNewChatMessage} onBack={() => setView('dashboard')} />;
            case 'quiz':
                return <QuizView notes={notes} onBack={() => setView('dashboard')} onQuizComplete={handleQuizComplete} />;
            case 'history':
                return (
                    <div className="p-4 md:p-8 h-full flex flex-col">
                         <button onClick={() => setView('dashboard')} className="flex items-center text-slate-300 hover:text-white transition-colors mb-4 self-start">
                             <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back to Dashboard
                         </button>
                         <h2 className="text-3xl font-bold mb-6">Quiz History</h2>
                         {quizHistory.length === 0 ? (
                             <p className="text-slate-400">You haven't completed any quizzes yet.</p>
                         ) : (
                             <div className="space-y-4 overflow-y-auto">
                                 {quizHistory.map(quiz => (
                                     <div key={quiz.id} className="bg-slate-800 p-4 rounded-lg">
                                         <p className="font-semibold">Quiz from {new Date(quiz.createdAt).toLocaleString()}</p>
                                         <p className="text-indigo-400">Score: {quiz.score}/{quiz.questions.length}</p>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                );
            case 'dashboard':
            default:
                return (
                    <div className="p-4 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                           <DashboardCard
                                icon={<CheckSquareIcon className="w-6 h-6 text-indigo-300" />}
                                title="Generate Quiz"
                                description="Test your knowledge with an AI-generated quiz."
                                onClick={() => setView('quiz')}
                                disabled={notes.length === 0}
                            />
                            <DashboardCard
                                icon={<MessageSquareIcon className="w-6 h-6 text-indigo-300" />}
                                title="Chat with Notes"
                                description="Ask questions and get answers from your notes."
                                onClick={() => setView('chat')}
                                disabled={notes.length === 0}
                            />
                            <DashboardCard
                                icon={<BookOpenIcon className="w-6 h-6 text-indigo-300" />}
                                title="View Quiz History"
                                description="Review your past quiz scores and performance."
                                onClick={() => setView('history')}
                                disabled={quizHistory.length === 0}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold">My Notes</h2>
                                <button onClick={() => setIsUploaderOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center transition-colors">
                                    <PlusIcon className="w-5 h-5 mr-2" /> Add Note
                                </button>
                            </div>
                            {notes.length === 0 ? (
                                <div className="text-center py-10 bg-slate-800 rounded-lg">
                                    <p className="text-slate-400">You have no notes yet.</p>
                                    <p className="text-slate-500">Click "Add Note" to get started!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {notes.map(note => (
                                        <div key={note.id} className="bg-slate-800 p-4 rounded-lg flex items-center justify-between hover:bg-slate-700/50 transition-colors">
                                            <div onClick={() => setActiveNote(note)} className="cursor-pointer flex-grow">
                                                <div className="flex items-center">
                                                    {note.type === 'text' ? <TextIcon className="w-5 h-5 mr-3 text-slate-400"/> : <ImageIcon className="w-5 h-5 mr-3 text-slate-400"/>}
                                                    <p className="font-semibold">{note.title}</p>
                                                </div>
                                                <p className="text-sm text-slate-500 ml-8">Created on {new Date(note.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <button onClick={() => deleteNote(note.id)} className="p-2 text-slate-500 hover:text-red-400 rounded-full transition-colors">
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="h-screen w-screen bg-slate-900 text-white flex flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto">
                {renderView()}
            </main>
            {isUploaderOpen && <NoteUploader onClose={() => setIsUploaderOpen(false)} onAddNote={addNote} />}
        </div>
    );
};

export default App;
