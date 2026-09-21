import { useEffect, useState } from 'react'
import './App.css'

const DUMMY_SKILL_GAPS = {
  skillGaps: [
    {
      skill: 'Docker',
      priority: 'HIGH',
      requiredLevel: 'working_knowledge'
    },
    {
      skill: 'FastAPI',
      priority: 'MEDIUM',
      requiredLevel: 'working_knowledge'
    }
  ]
}

function App() {
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRoadmap = async () => {
      const urls = [
        'http://127.0.0.1:8002/api/roadmap',
        'http://127.0.0.1:8001/api/roadmap',
        'http://127.0.0.1:8000/api/roadmap'
      ]

      let lastError = ''

      for (const url of urls) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(DUMMY_SKILL_GAPS)
          })

          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`)
          }

          const payload = await response.json()
          setRoadmap(payload)
          return
        } catch (err) {
          lastError = err.message
        }
      }

      setError(lastError || 'Unable to load the roadmap.')
    }

    loadRoadmap().finally(() => setLoading(false))
  }, [])

  return (
    <main className="roadmap-page">
      <header className="page-header">
        <p className="eyebrow">CareerForge</p>
        <h1>Learning Roadmap</h1>
        <p className="subtitle">
          Priority skill gaps are translated into a practical learning plan.
        </p>
      </header>

      {loading && <div className="status">Loading roadmap...</div>}

      {error && <div className="status error">{error}</div>}

      {roadmap && roadmap.roadmap && (
        <section className="roadmap-grid">
          {roadmap.roadmap.map((item) => (
            <article key={item.skill} className="roadmap-card">
              <div className="card-topline">
                <span className="priority-tag">{item.priority}</span>
                <span className="level-tag">{item.requiredLevel || 'Target level'}</span>
              </div>

              <h2>{item.skill}</h2>

              <div className="detail-section">
                <h3>Learning topics</h3>
                <ul>
                  {item.topics.map((topic, index) => (
                    <li key={`${item.skill}-topic-${index}`}>{topic}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-section">
                <h3>Recommended resources</h3>
                <ul>
                  {item.resources.map((resource, index) => (
                    <li key={`${item.skill}-resource-${index}`}>
                      <a href={resource.url} target="_blank" rel="noreferrer">
                        {resource.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="detail-section">
                <h3>Practice tasks</h3>
                <ul>
                  {item.practice.map((task, index) => (
                    <li key={`${item.skill}-task-${index}`}>{task}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default App
