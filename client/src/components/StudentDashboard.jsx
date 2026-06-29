import React, { useState, useEffect } from 'react';
import { Flame, ShieldAlert, Waves, Mountain, GraduationCap, Video, CheckSquare, Gamepad2, Timer, Award } from 'lucide-react';
import DrillGame from './DrillGame';

export default function StudentDashboard({ user, onLogout }) {
  const [selectedDisaster, setSelectedDisaster] = useState(null); // 'fire', 'earthquake', 'flood', 'landslide'
  const [activeTab, setActiveTab] = useState(null); // 'drill', 'video', 'quiz'

  // Quiz states
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  // Student scores history
  const [scoreHistory, setScoreHistory] = useState([]);

  const fetchScoreHistory = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/teacher/${user.teacher_id}/students`);
      const data = await response.json();
      const me = data.students.find(s => s.id === user.id);
      if (me) {
        setScoreHistory(me.scores || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchScoreHistory();
  }, [selectedDisaster, activeTab]);

  const loadQuiz = async (type) => {
    setQuizLoading(true);
    setQuizFinished(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    try {
      const response = await fetch(`http://localhost:3001/api/quizzes/${type}`);
      const data = await response.json();
      setQuizQuestions(data.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswerSelect = (index) => {
    setSelectedAnswer(index);
  };

  const handleNextQuestion = () => {
    const isCorrect = selectedAnswer === quizQuestions[currentQuestionIndex].answer;
    let newScore = quizScore;
    if (isCorrect) newScore += 1;

    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setQuizScore(newScore);
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      // Finished
      const finalPercentage = Math.round((newScore / quizQuestions.length) * 100);
      setQuizScore(finalPercentage);
      setQuizFinished(true);
      submitScore('quiz', finalPercentage, 30); // 30s estimated quiz duration
    }
  };

  const submitScore = async (activityType, score, durationSeconds) => {
    try {
      await fetch('http://localhost:3001/api/student/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      console.error("Failed to post score to DB", err);
    }
  };

  const handleDrillFinish = (success, timeTaken, score) => {
    submitScore('drill', score, timeTaken);
  };

  const disasters = [
    { id: 'fire', label: 'Fire Safety', icon: Flame, color: 'var(--color-fire)', desc: 'Escape classroom fire breakouts and handle extinguishers' },
    { id: 'earthquake', label: 'Earthquake Drill', icon: ShieldAlert, color: 'var(--color-earthquake)', desc: 'Learn drop, cover, and hold procedures' },
    { id: 'flood', label: 'Flood Survival', icon: Waves, color: 'var(--color-flood)', desc: 'Find high ground and safety points during sudden floods' },
    { id: 'landslide', label: 'Landslide Safety', icon: Mountain, color: 'var(--color-landslide)', desc: 'Evacuate dangerous slide zones and seek shelter' }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GraduationCap size={32} color="var(--color-accent-primary)" />
            Student Disaster Drills Center
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Student: <strong>{user.name}</strong> | Roll No: {user.roll_no} | Class: {user.class_assigned} | Teacher: {user.teacher_name}
          </p>
        </div>
        <button onClick={onLogout} className="btn-secondary">Logout</button>
      </header>

      {!selectedDisaster ? (
        <>
          {/* Disaster Grid */}
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Choose a Disaster Training Module</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {disasters.map(d => {
              const Icon = d.icon;
              return (
                <div
                  key={d.id}
                  onClick={() => {
                    setSelectedDisaster(d.id);
                    setActiveTab(null);
                  }}
                  className="glass-panel glass-panel-hover"
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${d.color}15`, display: 'flex', alignItems: 'center', justifySelf: 'start', justifyContent: 'center', border: `1px solid ${d.color}30` }}>
                    <Icon size={24} color={d.color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>{d.label}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{d.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drill Performance Summary */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>My Safety Badges & Drill Logs</h2>
            {scoreHistory.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>
                You haven't participated in any safety drills or quizzes yet. Select a disaster module above to start!
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)' }}>Activity</th>
                    <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)' }}>Disaster</th>
                    <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)' }}>Safety Score</th>
                    <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)' }}>Duration</th>
                    <th style={{ padding: '12px 8px', color: 'var(--color-text-secondary)' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreHistory.map(sc => (
                    <tr key={sc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '16px 8px', fontWeight: 'bold' }}>{sc.activity_type.toUpperCase()}</td>
                      <td style={{ padding: '16px 8px', textTransform: 'capitalize' }}>{sc.disaster_type}</td>
                      <td style={{ padding: '16px 8px', color: sc.score >= 80 ? 'var(--color-safe)' : 'var(--color-earthquake)' }}>
                        {sc.score} {sc.activity_type === 'quiz' ? '%' : 'pts'}
                      </td>
                      <td style={{ padding: '16px 8px' }}>{sc.duration_seconds}s</td>
                      <td style={{ padding: '16px 8px', color: 'var(--color-text-muted)' }}>{new Date(sc.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div>
          {/* Back button */}
          <button onClick={() => setSelectedDisaster(null)} className="btn-secondary" style={{ marginBottom: '24px' }}>
            ← Back to Disasters
          </button>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '24px', textTransform: 'capitalize' }}>{selectedDisaster} Preparedness Training</h2>
          </div>

          {/* Activity selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
            {[
              { id: 'drill', label: '1. Start Evacuation Drill', icon: Gamepad2, desc: 'Interactive floorplan escape game' },
              { id: 'video', label: '2. Awareness Class', icon: Video, desc: 'Watch safety guidelines and tips' },
              { id: 'quiz', label: '3. Challenge Quiz', icon: CheckSquare, desc: 'Test your emergency response safety knowledge' }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'quiz') {
                      loadQuiz(selectedDisaster);
                    }
                  }}
                  style={{
                    background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${activeTab === tab.id ? 'var(--color-accent-primary)' : 'var(--glass-border)'}`,
                    borderRadius: '12px',
                    padding: '20px',
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <Icon size={24} style={{ color: activeTab === tab.id ? 'var(--color-accent-primary)' : 'var(--color-text-muted)', marginBottom: '10px' }} />
                  <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>{tab.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{tab.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Interactive Screen container */}
          {activeTab && (
            <div className="glass-panel" style={{ minHeight: '400px' }}>
              {activeTab === 'drill' && (
                <DrillGame
                  schoolId={user.school_id}
                  disasterType={selectedDisaster}
                  onFinish={handleDrillFinish}
                />
              )}

              {activeTab === 'video' && (
                <div>
                  <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Safety Awareness Animation</h3>
                  
                  {/* Dynamic Mock Video player with Educational Slides */}
                  <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', background: '#000', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
                    <div style={{ padding: '40px', textAlign: 'center', background: 'linear-gradient(135deg, #131b2e 0%, #070a13 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px' }}>
                      <Video size={48} style={{ color: 'var(--color-accent-primary)', marginBottom: '16px' }} />
                      <h4 style={{ fontSize: '22px', marginBottom: '8px' }}>
                        {selectedDisaster.toUpperCase()} EVACUATION TIPS
                      </h4>
                      
                      <div style={{ maxWidth: '550px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', margin: '20px 0', textAlign: 'left', fontSize: '14px' }}>
                        <h5 style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--color-earthquake)' }}>Key Survival Points:</h5>
                        {selectedDisaster === 'fire' && (
                          <ul style={{ paddingLeft: '18px', lineHeight: '1.6' }}>
                            <li>Stay low and crawl under smoke to breathe clean air.</li>
                            <li>Touch closed doors with the back of your hand; if hot, find another exit.</li>
                            <li>Use fire extinguishers using the PASS technique: Pull, Aim, Squeeze, Sweep.</li>
                          </ul>
                        )}
                        {selectedDisaster === 'earthquake' && (
                          <ul style={{ paddingLeft: '18px', lineHeight: '1.6' }}>
                            <li>Drop to the floor, take cover under a sturdy desk, and hold on tight.</li>
                            <li>Stay away from glass windows, heavy bookcases, and outer walls.</li>
                            <li>Evacuate only once shaking stops completely. Do not use elevators.</li>
                          </ul>
                        )}
                        {selectedDisaster === 'flood' && (
                          <ul style={{ paddingLeft: '18px', lineHeight: '1.6' }}>
                            <li>Immediately move to higher levels like the upper floors or roof.</li>
                            <li>Do not walk or step in moving water. Six inches of water can knock you down.</li>
                            <li>Avoid touching any electrical equipment that has gotten wet.</li>
                          </ul>
                        )}
                        {selectedDisaster === 'landslide' && (
                          <ul style={{ paddingLeft: '18px', lineHeight: '1.6' }}>
                            <li>Move away from landslide paths or slopes as fast as possible.</li>
                            <li>If inside and unable to escape, curl into a ball and cover your head under cover.</li>
                            <li>Listen for unusual rumbling sounds or crackling trees.</li>
                          </ul>
                        )}
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        Play the evacuation drill next to practice these safety points on your school map!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'quiz' && (
                <div>
                  <h3 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Timer size={20} color="var(--color-earthquake)" />
                    Emergency Challenge: {selectedDisaster.toUpperCase()} QUIZ
                  </h3>

                  {quizLoading ? (
                    <p>Loading quiz questions...</p>
                  ) : quizFinished ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <Award size={48} style={{ color: 'var(--color-safe)', marginBottom: '16px' }} />
                      <h4 style={{ fontSize: '24px', marginBottom: '8px' }}>Challenge Complete!</h4>
                      <p style={{ fontSize: '18px', marginBottom: '20px' }}>
                        Your Score: <strong style={{ color: 'var(--color-safe)' }}>{quizScore}%</strong>
                      </p>
                      <button
                        onClick={() => loadQuiz(selectedDisaster)}
                        className="btn-primary"
                      >
                        Retake Quiz
                      </button>
                    </div>
                  ) : quizQuestions.length > 0 ? (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        Question {currentQuestionIndex + 1} of {quizQuestions.length}
                      </span>
                      <h4 style={{ fontSize: '18px', margin: '12px 0 24px 0' }}>
                        {quizQuestions[currentQuestionIndex].question}
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                        {quizQuestions[currentQuestionIndex].options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAnswerSelect(idx)}
                            style={{
                              textAlign: 'left',
                              padding: '16px',
                              borderRadius: '8px',
                              background: selectedAnswer === idx ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${selectedAnswer === idx ? 'var(--color-accent-primary)' : 'var(--glass-border)'}`,
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: '14px',
                              transition: 'var(--transition-fast)'
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleNextQuestion}
                        disabled={selectedAnswer === null}
                        className="btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        {currentQuestionIndex + 1 === quizQuestions.length ? 'Finish Quiz' : 'Next Question'}
                      </button>
                    </div>
                  ) : (
                    <p>No questions found for this disaster.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
