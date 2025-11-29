import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Droplet,
  AlertTriangle,
  FileText,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { MdOutlineDashboard, MdOutlineWaterDrop, MdOutlineNotifications, MdOutlineDescription, MdOutlineSettings, MdOutlineHelp } from 'react-icons/md';
import './Sidebar.css';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

const navSections = [
  {
    title: 'Main',
    items: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: <MdOutlineDashboard size={20} />,
        description: 'View all models',
      },
    ],
  },
  {
    title: 'Monitoring',
    items: [
      {
        path: '/sensors',
        label: 'Sensors',
        icon: <MdOutlineWaterDrop size={20} />,
        description: 'Sensor data',
      },
      {
        path: '/alerts',
        label: 'Alerts',
        icon: <MdOutlineNotifications size={20} />,
        description: 'Alert history',
      },
      {
        path: '/reports',
        label: 'Reports',
        icon: <MdOutlineDescription size={20} />,
        description: 'View reports',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        path: '/settings',
        label: 'Settings',
        icon: <MdOutlineSettings size={20} />,
        description: 'System settings',
      },
      {
        path: '/help',
        label: 'Help',
        icon: <MdOutlineHelp size={20} />,
        description: 'Documentation',
      },
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
          <span className="logo-icon">⚡</span>
          <h1>SWAT</h1>
        </div>
        <p className="sidebar-tagline">Detection System</p>
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
          <p className="footer-caption">Anomaly Detection</p>
        </div>
      </div>
    </aside>
  );
}
