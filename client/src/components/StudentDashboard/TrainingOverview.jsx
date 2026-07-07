import DrillGame from '../DrillGame';
import ActivitySelector from './ActivitySelector';
import VideoActivity from './VideoActivity';
import QuizActivity from './QuizActivity';

export default function TrainingOverview({
  selectedDisaster, handleSelectDisaster, isMobile, activeTab, setActiveTab,
  user, submitScore, quizProps
}) {
  if (!selectedDisaster) return null;

  return (
    <div>
      <button onClick={() => handleSelectDisaster(null)} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        ← Back to Menu 🗺️
      </button>
      <div style={{ background: '#fff', borderRadius: '24px', padding: '24px', border: '1px solid #e0f2fe' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', textTransform: 'capitalize', marginBottom: '32px', margin: 0 }}>
          {selectedDisaster} Preparedness Task ✨
        </h2>
        <ActivitySelector isMobile={isMobile} activeTab={activeTab} setActiveTab={setActiveTab} />
        {activeTab ? (
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #eef2f6' }}>
            {activeTab === 'drill' && (
              <DrillGame schoolId={user?.school_id} disasterType={selectedDisaster} onFinish={(s, t, sc) => submitScore('drill', sc, t)} />
            )}
            {activeTab === 'video' && <VideoActivity selectedDisaster={selectedDisaster} />}
            {activeTab === 'quiz' && (
              <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                <QuizActivity selectedDisaster={selectedDisaster} {...quizProps} />
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>👇 Select an activity above to start your safety training! 🎯</div>
        )}
      </div>
    </div>
  );
}
