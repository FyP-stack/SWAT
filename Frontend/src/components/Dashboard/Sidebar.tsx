import { useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  description?: string;
}

const navSections = [
  {
    title: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: '📊', description: 'View all models' },
    ],
  },
  {
    title: 'Evaluation',
    items: [
      { path: '/sensors', label: 'Sensors', icon: '🔌', description: 'Sensor data' },
      { path: '/alerts', label: 'Alerts', icon: '⚠️', description: 'Alert history' },
      { path: '/reports', label: 'Reports', icon: '📋', description: 'Generate reports' },
    ],
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="logo-icon">🛡️</span>
          <h1>SWaT</h1>
        </div>
        <p className="sidebar-tagline">Anomaly Detection</p>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.title} className="nav-section">
            <h3 className="nav-section-title">{section.title}</h3>
            <ul className="nav-items">
              {section.items.map((item) => (
                <li key={item.path}>
                  <button
                    className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => handleNavigation(item.path)}
                    title={item.description}
                  >
                    <span className="nav-item-icon">{item.icon}</span>
                    <span className="nav-item-label">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-content">
          <p className="footer-text">v1.0.0</p>
          <p className="footer-caption">SWaT Monitoring System</p>
        </div>
      </div>
    </aside>
  );
}
