import { Video } from 'lucide-react';

export default function VideoActivity({ selectedDisaster }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px' }}>
      <div style={{ background: '#0f172a', borderRadius: '20px', padding: '40px 16px', color: '#fff' }}>
        <Video size={48} color="#38bdf8" style={{ marginBottom: '20px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', margin: 0 }}>🚨 Essential {selectedDisaster} Protocols 📢</h3>
        <div style={{ textAlign: 'left', maxWidth: '500px', margin: '24px auto 0 auto', fontSize: '14px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', lineHeight: '1.8' }}>
          {selectedDisaster === 'fire' ? (
            <>
              🏃 <b>Crawl low under smoke</b> to stay safe!<br />
              🤚 Use the <b>back of your hand</b> to check doors.<br />
              🧯 Remember <b>PASS</b> when using extinguishers.
            </>
          ) : (
            <>
              🛑 <b>Drop, Cover, and Hold On!</b><br />
              🪟 Stay far away from windows and glass.<br />
              🚪 <b>Don't use elevators</b>—always use stairs.
            </>
          )}
        </div>
      </div>
    </div>
  );
}
