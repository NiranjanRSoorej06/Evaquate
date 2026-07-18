import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../Toast';

export function useStudentDashboard(user) {
  const addToast = useToast();
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [sidebarTab, setSidebarTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizPhase, setQuizPhase] = useState('browse');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [finalPercentage, setFinalPercentage] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchScoreHistory = useCallback(async () => {
    if (!user?.teacher_id || !user?.id) return;
    try {
      const response = await fetch(`/api/teacher/${user.teacher_id}/students`, { credentials: 'include', skipGlobalToast: true });
      const data = await response.json();
      const me = data.students?.find(s => s.id === user.id);
      if (me) setScoreHistory(me.scores || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load performance score history.', 'error');
    }
  }, [user?.teacher_id, user?.id, addToast]);

  useEffect(() => { fetchScoreHistory(); }, [fetchScoreHistory]);

  const handleSelectDisaster = (disasterId) => {
    setSelectedDisaster(disasterId);
    setActiveTab(null);
    setQuizFinished(false);
    setQuizQuestions([]);
    setActiveQuiz(null);
    setQuizPhase('browse');
    setAvailableQuizzes([]);
  };

  const fetchAvailableQuizzes = useCallback(async (disasterType) => {
    setQuizLoading(true);
    try {
      const query = disasterType ? `?disaster=${encodeURIComponent(disasterType)}` : '';
      const response = await fetch(`/api/student/quizzes${query}`, { credentials: 'include', skipGlobalToast: true });
      const data = await response.json();
      setAvailableQuizzes(data.quizzes || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load available quizzes.', 'error');
      setAvailableQuizzes([]);
    } finally {
      setQuizLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (activeTab === 'quiz' && selectedDisaster) {
      setQuizPhase('browse');
      setActiveQuiz(null);
      setQuizQuestions([]);
      setQuizFinished(false);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setQuizCorrectCount(0);
      setFinalPercentage(0);
      fetchAvailableQuizzes(selectedDisaster);
    }
  }, [activeTab, selectedDisaster, fetchAvailableQuizzes]);

  const loadQuiz = async (quizId) => {
    if (!quizId) return false;
    setQuizLoading(true);
    setQuizFinished(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setQuizCorrectCount(0);
    setFinalPercentage(0);
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, { credentials: 'include', skipGlobalToast: true });
      const data = await response.json();
      if (data?.questions?.length) {
        setQuizQuestions(data.questions);
        setQuizPhase('taking');
        return true;
      }
      setQuizQuestions([]);
      return false;
    } catch (err) {
      console.error(err);
      addToast('Failed to load the quiz.', 'error');
      setQuizQuestions([]);
      return false;
    } finally {
      setQuizLoading(false);
    }
  };

  const startQuiz = async (quiz) => {
    if (!quiz?.id) return;
    setActiveQuiz(quiz);
    setSelectedDisaster(quiz.disaster_type);
    const loaded = await loadQuiz(quiz.id);
    if (!loaded) {
      setQuizPhase('browse');
      setActiveQuiz(null);
    }
  };

  const handleAnswerSelect = (index) => setSelectedAnswer(index);

  const submitScore = async (activityType, score, durationSeconds) => {
    if (!user?.id || !selectedDisaster) return;
    try {
      await fetch('/api/student/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          student_id: user.id,
          disaster_type: selectedDisaster,
          activity_type: activityType,
          score,
          duration_seconds: durationSeconds
        }),
        skipGlobalToast: true
      });
      fetchScoreHistory();
    } catch (err) {
      console.error('Failed to post score', err);
      addToast('Failed to submit activity score.', 'error');
    }
  };

  const handleNextQuestion = () => {
    const isCorrect = selectedAnswer === quizQuestions[currentQuestionIndex].answer;
    const nextCorrectCount = quizCorrectCount + (isCorrect ? 1 : 0);
    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setQuizCorrectCount(nextCorrectCount);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      const percentage = Math.round((nextCorrectCount / quizQuestions.length) * 100);
      setFinalPercentage(percentage);
      setQuizFinished(true);
      setQuizPhase('finished');
      submitScore('quiz', percentage, 30);
    }
  };

  const goToOverview = () => {
    setSidebarTab('overview');
    handleSelectDisaster(null);
    setIsSidebarOpen(false);
  };

  const goToPerformance = () => {
    setSidebarTab('performance');
    setIsSidebarOpen(false);
  };

  return {
    selectedDisaster, activeTab, setActiveTab, sidebarTab, isSidebarOpen, setIsSidebarOpen,
    isMobile, availableQuizzes, activeQuiz, quizPhase, setQuizPhase, quizQuestions,
    currentQuestionIndex, selectedAnswer, finalPercentage, quizFinished, quizLoading,
    scoreHistory, handleSelectDisaster, fetchAvailableQuizzes, startQuiz,
    handleAnswerSelect, handleNextQuestion, submitScore, goToOverview, goToPerformance
  };
}
