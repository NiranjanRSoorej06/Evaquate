import React, { useState, useEffect, useCallback } from 'react';
import { Flame, ShieldAlert, Waves, Mountain, GraduationCap, Video, CheckSquare, Gamepad2, LogOut, Award, Sliders, ChevronRight, Menu, X } from 'lucide-react';
import DrillGame from './DrillGame';

export default function StudentDashboard({ user, onLogout }) {
  const [selectedDisaster, setSelectedDisaster] = useState(null); 
  const [activeTab, setActiveTab] = useState(null); 
  const [sidebarTab, setSidebarTab] = useState('overview'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isMobile, setIsMobile] = useState(false);

  // Quiz states
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

  // Student scores history
  const [scoreHistory, setScoreHistory] = useState([]);

  // Track screen resize safely
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize(); // Check layout on initial mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchScoreHistory = useCallback(async () => {
    if (!user?.teacher_id || !user?.id) return;
    try {
      const response = await fetch(`http://localhost:3001/api/teacher/${user.teacher_id}/students`, { credentials: 'include' });
      const data = await response.json();
      const me = data.students?.find(s => s.id === user.id);
      if (me) setScoreHistory(me.scores || []);
    } catch (err) {
      console.error(err);
    }
  }, [user?.teacher_id, user?.id]);

  useEffect(() => {
    fetchScoreHistory();
  }, [fetchScoreHistory]);

  const handleSelectDisaster = (disasterId) => {
    setSelectedDisaster(disasterId);
    setActiveTab(null);
    setQuizFinished(false);
    setQuizQuestions([]);
    setActiveQuiz(null);
    setQuizPhase('browse');
    setAvailableQuizzes([]);
  };

  const fetchAvailableQuizzes = useCallback(async () => {
    setQuizLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/student/quizzes', { credentials: 'include' });
      const data = await response.json();
      setAvailableQuizzes(data.quizzes || []);
    } catch (err) {
      console.error(err);
      setAvailableQuizzes([]);
    } finally {
      setQuizLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'quiz') {
      setQuizPhase('browse');
      setActiveQuiz(null);
      setQuizQuestions([]);
      setQuizFinished(false);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setQuizCorrectCount(0);
      setFinalPercentage(0);
      fetchAvailableQuizzes();
    }
  }, [activeTab, fetchAvailableQuizzes]);

  const loadQuiz = async (type) => {
    if (!type) return;
    setQuizLoading(true);
    setQuizFinished(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setQuizCorrectCount(0);
    setFinalPercentage(0);
    try {
      const response = await fetch(`http://localhost:3001/api/quizzes/${type}`, { credentials: 'include' });
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
      setQuizQuestions([]);
      return false;
    } finally {
      setQuizLoading(false);
    }
  };

  const startQuiz = async (quiz) => {
    if (!quiz?.disaster_type) return;
    setActiveQuiz(quiz);
    setSelectedDisaster(quiz.disaster_type);
    const loaded = await loadQuiz(quiz.disaster_type);
    if (!loaded) {
      setQuizPhase('browse');
      setActiveQuiz(null);
    }
  };

  const getDisasterMeta = (disasterType) => disasters.find(d => d.id === disasterType);

  const handleAnswerSelect = (index) => setSelectedAnswer(index);

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

  const submitScore = async (activityType, score, durationSeconds) => {
    if (!user?.id || !selectedDisaster) return;
    try {
      await fetch('http://localhost:3001/api/student/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          student_id: user.id,
          disaster_type: selectedDisaster,
          activity_type: activityType,
          score,
          duration_seconds: durationSeconds
        })
      });
      fetchScoreHistory();
    } catch (err) {
      console.error("Failed to post score", err);
    }
  };

  const disasters = [
    { id: 'fire', label: 'Fire Safety', emoji: '🔥', icon: Flame, color: '#ef4444', desc: 'Master fire escapes and extinguisher PASS techniques.' },
    { id: 'earthquake', label: 'Earthquake Drill', emoji: '🧱', icon: ShieldAlert, color: '#f97316', desc: 'Learn drop, cover, and hold procedures on campus.' },
    { id: 'flood', label: 'Flood Survival', emoji: '🌊', icon: Waves, color: '#0ea5e9', desc: 'Find high ground and safety points during floods.' },
    { id: 'landslide', label: 'Landslide Safety', emoji: '🧗', icon: Mountain, color: '#8b5cf6', desc: 'Evacuate slide zones and follow shelter paths.' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: '100%', minHeight: '100vh', backgroundColor: '#f0f9ff', fontFamily: '"Plus Jakarta Sans", sans-serif', position: 'relative', overflowX: 'hidden' }}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght=400;500;600;700&display=swap');
        .sidebar-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 18px; border: none; background: transparent; color: #e0f2fe; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; font-size: 14px; font-weight: 500; }
        .sidebar-item:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
        .sidebar-active { background: rgba(255, 255, 255, 0.15) !important; color: #fff !important; font-weight: 600; }
        .module-card { background: #fff; border-radius: 20px; padding: 24px; border: 1px solid #e0f2fe; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.03); position: relative; overflow: hidden; }
        .module-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(2, 132, 199, 0.08); border-color: #bae6fd; }
        .activity-tab { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 20px; border-radius: 16px; border: 1.5px solid #e0f2fe; background: #fff; cursor: pointer; transition: all 0.2s ease; text-align: left; width: 100%; box-sizing: border-box; }
        .activity-tab-active { background: #f0f9ff; border-color: #0284c7; box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.05); }
        .quiz-option { width: 100%; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; text-align: left; cursor: pointer; transition: all 0.15s; font-size: 14px; font-family: inherit; }
        .quiz-option:hover { border-color: #0284c7; background: #f0f9ff; }
        .quiz-option-selected { background: #0284c7 !important; color: #fff !important; border-color: #0284c7 !important; }
        .quiz-picker-card { width: 100%; text-align: left; border-radius: 16px; border: 1px solid #e2e8f0; background: #fff; padding: 18px; cursor: pointer; transition: all 0.15s ease; font-family: inherit; }
        .quiz-picker-card:hover { border-color: #0284c7; box-shadow: 0 8px 20px rgba(2, 132, 199, 0.08); transform: translateY(-1px); }
        .quiz-picker-card-current { border-color: #bae6fd; background: #f0f9ff; }
        .data-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 600px; }
        .data-table th { padding: 16px; background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e2e8f0; }
        .data-table td { padding: 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 14px; background: #fff; }
        .btn-primary { background: #0284c7; color: #fff; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { background: #0369a1; transform: scale(1.02); }
      `}</style>

      {/* Top Fixed Mobile Navbar (Shows up ONLY on mobile layout) */}
      {isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0284c7', color: '#ffffff', padding: '16px 24px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 950, boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)', height: '60px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={22} color="#ffffff" />
            <span style={{ fontWeight: '700', fontSize: '16px' }}>Drill Matrix 🚀</span>
          </div>
          {/* Here are your clean three lines (hamburger icon) / close button toggle */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
          >
            {isSidebarOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      )}

      {/* Dimmed backdrop background when side nav pulls out on phone screen */}
      {isMobile && isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', zIndex: 990 }}
        />
      )}

      {/* Left Navigation Sidebar */}
      <aside style={{
        width: '280px', 
        background: '#0284c7', 
        padding: '32px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        color: '#fff',
        zIndex: 1000,
        boxSizing: 'border-box',
        transition: 'transform 0.3s ease',
        ...(isMobile ? {
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
        } : {})
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#fff', padding: '8px', borderRadius: '10px' }}>
              <GraduationCap size={24} color="#0284c7" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>Drill Matrix 🚀</h2>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => { setSidebarTab('overview'); handleSelectDisaster(null); setIsSidebarOpen(false); }} className={`sidebar-item ${sidebarTab === 'overview' ? 'sidebar-active' : ''}`}>
            <Sliders size={18} /> Training Console 🧭
          </button>
          <button onClick={() => { setSidebarTab('performance'); setIsSidebarOpen(false); }} className={`sidebar-item ${sidebarTab === 'performance' ? 'sidebar-active' : ''}`}>
            <Award size={18} /> Performance Logs 🏆
          </button>
        </nav>

        <button onClick={onLogout} className="sidebar-item" style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.1)' }}>
          <LogOut size={18} /> Sign Out 🚪
        </button>
      </aside>

      {/* Main Content Pane */}
      <main className="main-surface" style={{ flex: 1, padding: isMobile ? '20px' : '40px', paddingTop: isMobile ? '84px' : '40px', overflowY: 'auto', boxSizing: 'border-box', width: '100%' }}>
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', margin: 0 }}>
            {sidebarTab === 'overview' ? 'Ready for Training? ⭐' : 'Mission History 📖'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500', margin: 0 }}>
            🎒 Student Explorer: <span style={{ color: '#0284c7', fontWeight: '600' }}>{user?.name || 'Guest'}</span> | 🏫 Room: <span style={{ color: '#0f172a', fontWeight: '600' }}>{user?.class_assigned || 'N/A'}</span>
          </p>
        </header>

        {sidebarTab === 'overview' ? (
          <>
            {!selectedDisaster ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {disasters.map(d => {
                  const Icon = d.icon;
                  return (
                    <div key={d.id} className="module-card" onClick={() => handleSelectDisaster(d.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ background: `${d.color}10`, width: '50px', height: '50px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                          <Icon size={24} color={d.color} />
                        </div>
                        <span style={{ fontSize: '24px' }}>{d.emoji}</span>
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', margin: 0 }}>{d.label}</h3>
                      <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6', marginBottom: '20px', marginTop: '8px' }}>{d.desc}</p>
                      <div style={{ display: 'flex', alignItems: 'center', color: '#0284c7', fontSize: '13px', fontWeight: '600' }}>
                        Let's Go! <ChevronRight size={16} style={{ marginLeft: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <button onClick={() => handleSelectDisaster(null)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ← Back to Menu 🗺️
                </button>

                <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', border: '1px solid #e0f2fe' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', textTransform: 'capitalize', marginBottom: '32px', margin: 0 }}>
                    {selectedDisaster} Preparedness Task ✨
                  </h2>

                  {/* Activity Selector (Becomes single column on phone widths) */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
                    {[
                      { id: 'drill', label: 'Evacuation Drill 🎮', icon: Gamepad2, note: 'Practice live escape paths.' },
                      { id: 'video', label: 'Awareness Class 📺', icon: Video, note: 'Watch safety guidelines.' },
                      { id: 'quiz', label: 'Knowledge Quiz 📝', icon: CheckSquare, note: 'Test your survival skills.' }
                    ].map(t => {
                      const Icon = t.icon;
                      return (
                        <button key={t.id} onClick={() => setActiveTab(t.id)} className={`activity-tab ${activeTab === t.id ? 'activity-tab-active' : ''}`}>
                          <Icon size={22} color={activeTab === t.id ? '#0284c7' : '#94a3b8'} />
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: activeTab === t.id ? '#0284c7' : '#1e293b' }}>{t.label}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{t.note}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Content View */}
                  {activeTab ? (
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #eef2f6' }}>
                      {activeTab === 'drill' && (
                        <DrillGame schoolId={user?.school_id} disasterType={selectedDisaster} onFinish={(s, t, sc) => submitScore('drill', sc, t)} />
                      )}

                      {activeTab === 'video' && (
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                          <div style={{ background: '#0f172a', borderRadius: '20px', padding: '40px 16px', color: '#fff' }}>
                            <Video size={48} color="#38bdf8" style={{ marginBottom: '20px' }} />
                            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', margin: 0 }}>🚨 Essential {selectedDisaster} Protocols 📢</h3>
                            <div style={{ textAlign: 'left', maxWidth: '500px', margin: '24px auto 0 auto', fontSize: '14px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', lineHeight: '1.8' }}>
                              {selectedDisaster === 'fire' ? (
                                <>
                                  🏃 <b>Crawl low under smoke</b> to stay safe!<br/>
                                  🤚 Use the <b>back of your hand</b> to check doors.<br/>
                                  🧯 Remember <b>PASS</b> when using extinguishers.
                                </>
                              ) : (
                                <>
                                  🛑 <b>Drop, Cover, and Hold On!</b><br/>
                                  🪟 Stay far away from windows and glass.<br/>
                                  🚪 <b>Don't use elevators</b>—always use stairs.
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'quiz' && (
                        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                          {quizLoading && quizPhase === 'browse' ? (
                            <p style={{ textAlign: 'center', color: '#64748b' }}>Loading available quizzes... ⏳</p>
                          ) : quizPhase === 'browse' ? (
                            <>
                              <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>
                                {getDisasterMeta(selectedDisaster)?.label || selectedDisaster} Quiz 📝
                              </h4>
                              <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0' }}>
                                Start the quiz your teacher uploaded for this module. It appears here as soon as it is uploaded.
                              </p>
                              {availableQuizzes.filter(quiz => quiz.disaster_type === selectedDisaster).length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                  {availableQuizzes
                                    .filter(quiz => quiz.disaster_type === selectedDisaster)
                                    .map(quiz => {
                                      const meta = getDisasterMeta(quiz.disaster_type);
                                      const Icon = meta?.icon || CheckSquare;
                                      return (
                                        <button
                                          key={quiz.id || quiz.disaster_type}
                                          type="button"
                                          onClick={() => startQuiz(quiz)}
                                          className="quiz-picker-card quiz-picker-card-current"
                                        >
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${meta?.color || '#0284c7'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                              <Icon size={22} color={meta?.color || '#0284c7'} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                              <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '16px', marginBottom: '4px' }}>{quiz.title}</div>
                                              <div style={{ color: '#64748b', fontSize: '13px' }}>
                                                {meta?.label || quiz.disaster_type} • {quiz.question_count} question{quiz.question_count === 1 ? '' : 's'}
                                              </div>
                                            </div>
                                            <div style={{ color: '#0284c7', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>Start →</div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                </div>
                              ) : (
                                <div style={{ textAlign: 'center', padding: '32px 16px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                  <p style={{ color: '#64748b', margin: 0 }}>
                                    No quiz available for {getDisasterMeta(selectedDisaster)?.label?.toLowerCase() || selectedDisaster} yet. Your teacher hasn&apos;t uploaded one for this module. 📋
                                  </p>
                                </div>
                              )}
                            </>
                          ) : quizLoading ? (
                            <p style={{ textAlign: 'center', color: '#64748b' }}>Loading quiz questions... ⏳</p>
                          ) : quizPhase === 'finished' || quizFinished ? (
                            <div style={{ textAlign: 'center' }}>
                              <Award size={64} color="#0284c7" style={{ marginBottom: '16px' }} />
                              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>Awesome Job! 🎉</h2>
                              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#0284c7', margin: '0 0 8px 0' }}>Your Score: {finalPercentage}%</h3>
                              {activeQuiz?.title && <p style={{ color: '#64748b', margin: '0 0 20px 0' }}>{activeQuiz.title}</p>}
                              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button onClick={() => activeQuiz && startQuiz(activeQuiz)} className="btn-primary">Try Again 🔄</button>
                                <button onClick={() => { setQuizPhase('browse'); fetchAvailableQuizzes(); }} className="btn-primary" style={{ background: '#e0f2fe', color: '#0284c7' }}>Back to Quiz 📚</button>
                              </div>
                            </div>
                          ) : quizQuestions.length > 0 ? (
                            <>
                              <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                                  {activeQuiz?.title || 'Knowledge Quiz'} • Question {currentQuestionIndex + 1} of {quizQuestions.length}
                                </div>
                              </div>
                              <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#1e293b', margin: '0 0 24px 0' }}>🤔 {quizQuestions[currentQuestionIndex]?.question}</h4>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                                {quizQuestions[currentQuestionIndex]?.options?.map((opt, i) => (
                                  <button key={i} onClick={() => handleAnswerSelect(i)} className={`quiz-option ${selectedAnswer === i ? 'quiz-option-selected' : ''}`}>{opt}</button>
                                ))}
                              </div>
                              <button disabled={selectedAnswer === null} onClick={handleNextQuestion} className="btn-primary" style={{ width: '100%' }}>Next Question ➡️</button>
                            </>
                          ) : (
                            <div style={{ textAlign: 'center' }}>
                              <p style={{ color: '#64748b', marginBottom: '16px' }}>This quiz is no longer available. Ask your teacher to upload it again. 📋</p>
                              <button onClick={() => { setQuizPhase('browse'); fetchAvailableQuizzes(); }} className="btn-primary">Back to Quizzes</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>👇 Select an activity above to start your safety training! 🎯</div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Performance Log View with overflow box fallback */
          <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #e0f2fe', overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Modality 🎯</th>
                  <th>Module 🧭</th>
                  <th>Success Rate ⭐</th>
                  <th>Duration ⏱️</th>
                  <th>Logged On 📅</th>
                </tr>
              </thead>
              <tbody>
                {scoreHistory.length > 0 ? scoreHistory.map(sc => (
                  <tr key={sc.id}>
                    <td style={{ fontWeight: '700' }}>{sc.activity_type?.toUpperCase()}</td>
                    <td style={{ textTransform: 'capitalize' }}>{sc.disaster_type}</td>
                    <td style={{ fontWeight: '700', color: sc.score >= 80 ? '#10b981' : '#f59e0b' }}>
                      {sc.score}{sc.activity_type === 'quiz' ? '%' : ' pts'} {sc.score >= 80 ? '🥇' : '🥈'}
                    </td>
                    <td>{sc.duration_seconds}s</td>
                    <td style={{ color: '#64748b' }}>{new Date(sc.timestamp).toLocaleDateString()}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No session logs found yet. Start training to collect trophies! 🏆</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}