import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bell, Clock3, Eye, Flame, Menu, Search, Sparkles, Users, X } from 'lucide-react'

const fallbackDebates = [
  { id: 1, question: 'Should artificial intelligence be regulated by governments?', category: 'Technology', status: 'live', audience: 2847, time_label: '12:48 remaining', description: 'Two leading voices unpack who should set the rules for the technology shaping our future.', tags: ['AI', 'Policy', 'Ethics'], side_a: { label: 'Regulate now', speaker: 'Dr. Maya Chen', votes: 1842 }, side_b: { label: 'Let innovation lead', speaker: 'Alex Rivera', votes: 1421 } },
  { id: 2, question: 'Is remote work better for society?', category: 'Culture', status: 'live', audience: 1534, time_label: '28:16 remaining', description: 'A spirited discussion about flexibility, community, and the future of the office.', tags: ['Work', 'Society'], side_a: { label: 'Remote first', speaker: 'Jamie Park', votes: 963 }, side_b: { label: 'Office matters', speaker: 'Sam Wilson', votes: 841 } },
  { id: 3, question: 'Will electric vehicles solve the climate crisis?', category: 'Climate', status: 'upcoming', audience: 892, time_label: 'Starts in 42 min', description: 'Beyond the hype: experts weigh transport electrification against wider systemic change.', tags: ['Climate', 'Transport'], side_a: { label: 'A vital solution', speaker: 'Nora Okafor', votes: 0 }, side_b: { label: 'Not nearly enough', speaker: 'Theo Martin', votes: 0 } },
]

const formatNumber = (number) => new Intl.NumberFormat('en', { notation: number > 9999 ? 'compact' : 'standard' }).format(number)

function DebateCard({ debate, featured = false, onOpen }) {
  const total = debate.side_a.votes + debate.side_b.votes
  const leading = total ? Math.round((debate.side_a.votes / total) * 100) : 50
  return (
    <article className={`debate-card ${featured ? 'featured' : ''}`}>
      <div className="card-topline">
        <div className="meta-cluster"><span className={`status ${debate.status}`}><i />{debate.status}</span><span className="category">{debate.category}</span></div>
        <span className="audience"><Eye size={15} /> {formatNumber(debate.audience)}</span>
      </div>
      <h3>{debate.question}</h3>
      <p className="description">{debate.description}</p>
      <div className="tags">{debate.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="versus">
        <div><strong>{debate.side_a.label}</strong><small>{debate.side_a.speaker}</small></div>
        <span>VS</span>
        <div className="align-right"><strong>{debate.side_b.label}</strong><small>{debate.side_b.speaker}</small></div>
      </div>
      {total > 0 && <div className="poll"><div className="poll-labels"><span>{leading}%</span><span>{100 - leading}%</span></div><div className="poll-track"><i style={{ width: `${leading}%` }} /></div></div>}
      <div className="card-footer"><span><Clock3 size={15} /> {debate.time_label}</span><button onClick={() => onOpen(debate)}>Enter debate <ArrowRight size={16} /></button></div>
    </article>
  )
}

function Arena({ debate, onClose, onVote }) {
  const [voted, setVoted] = useState(null)
  const total = debate.side_a.votes + debate.side_b.votes
  const aPercent = total ? Math.round((debate.side_a.votes / total) * 100) : 50
  const vote = async (side) => { if (!voted && debate.status === 'live') { setVoted(side); await onVote(debate.id, side) } }
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="arena" onMouseDown={(event) => event.stopPropagation()}>
      <button className="close" onClick={onClose} aria-label="Close"><X /></button>
      <span className={`status ${debate.status}`}><i />{debate.status}</span>
      <p className="eyebrow">THE QUESTION</p><h2>{debate.question}</h2>
      <p className="arena-intro">Listen to both sides. Vote for the argument that changed your mind.</p>
      <div className="arena-sides">
        <button className={voted === 'a' ? 'chosen' : ''} onClick={() => vote('a')} disabled={debate.status !== 'live' || !!voted}><span>A</span><h4>{debate.side_a.label}</h4><p>{debate.side_a.speaker}</p><strong>{aPercent}%</strong></button>
        <div className="versus-mark">VS</div>
        <button className={voted === 'b' ? 'chosen' : ''} onClick={() => vote('b')} disabled={debate.status !== 'live' || !!voted}><span>B</span><h4>{debate.side_b.label}</h4><p>{debate.side_b.speaker}</p><strong>{100 - aPercent}%</strong></button>
      </div>
      <p className="vote-note">{voted ? 'Your voice has been counted.' : debate.status === 'live' ? 'Choose a side to cast your vote' : 'Voting is not currently open'}</p>
    </section>
  </div>
}

export default function App() {
  const [debates, setDebates] = useState(fallbackDebates)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { fetch('/api/debates').then((res) => res.ok ? res.json() : Promise.reject()).then(setDebates).catch(() => {}) }, [])
  const visible = useMemo(() => debates.filter((debate) => {
    const searchable = [debate.question, debate.category, ...debate.tags].join(' ').toLowerCase()
    return (filter === 'all' || debate.status === filter) && searchable.includes(query.toLowerCase())
  }), [debates, filter, query])
  const vote = async (id, side) => {
    try { const response = await fetch(`/api/debates/${id}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ side }) }); if (!response.ok) return; const updated = await response.json(); setDebates((items) => items.map((item) => item.id === id ? updated : item)); setSelected(updated) } catch { /* The optimistic fallback remains usable offline. */ }
  }

  return <>
    <header><a className="brand" href="#top"><span><Sparkles size={21} /></span>PODIUM</a><nav className={menuOpen ? 'open' : ''}><a href="#debates">Debates</a><a href="#trending">Trending</a><a href="#about">How it works</a></nav><div className="header-actions"><button className="icon-button" aria-label="Notifications"><Bell size={19} /></button><button className="host">Host a debate</button><button className="menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu"><Menu /></button></div></header>
    <main id="top">
      <section className="hero"><div className="hero-copy"><div className="eyebrow"><Flame size={15} /> WHERE IDEAS COME ALIVE</div><h1>Better arguments.<br/><em>Brighter minds.</em></h1><p>Step into the arena. Hear compelling perspectives, challenge your thinking, and make your voice count.</p><div className="hero-actions"><a href="#debates">Explore debates <ArrowRight size={17} /></a><button onClick={() => setSelected(debates[0])}><span>▶</span> Watch featured</button></div><div className="community"><div className="avatars"><span>MC</span><span>AR</span><span>JP</span><span>+</span></div><p><strong>12,800+</strong> curious minds debating today</p></div></div><div className="hero-visual"><div className="glow"/><span className="float-badge"><Users size={16}/> 2,847 watching</span><DebateCard debate={debates[0]} featured onOpen={setSelected}/></div></section>
      <section className="debates" id="debates"><div className="section-heading"><div><p className="eyebrow">JOIN THE CONVERSATION</p><h2>Debates happening now</h2></div><p>Explore live discussions, discover new perspectives,<br/>and decide where you stand.</p></div><div className="toolbar"><div className="filters">{['all','live','upcoming','ended'].map((item) => <button className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}</div><label className="search"><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search debates..." /></label></div><div className="card-grid">{visible.map((debate) => <DebateCard key={debate.id} debate={debate} onOpen={setSelected}/>)}</div>{visible.length === 0 && <div className="empty">No debates match your search. Try another idea.</div>}</section>
      <section className="manifesto" id="about"><p className="eyebrow">WHY PODIUM</p><h2>Disagreement doesn't have to divide us.</h2><p>We built a place for thoughtful exchange — where curiosity wins over certainty, ideas are tested with respect, and every voice can move the conversation forward.</p><div><span><strong>01</strong>Listen deeply</span><span><strong>02</strong>Challenge openly</span><span><strong>03</strong>Vote thoughtfully</span></div></section>
    </main>
    <footer><a className="brand" href="#top"><span><Sparkles size={18} /></span>PODIUM</a><p>Ideas deserve an audience.</p><small>© 2026 Podium. Built for better conversations.</small></footer>
    {selected && <Arena debate={selected} onClose={() => setSelected(null)} onVote={vote}/>} 
  </>
}
