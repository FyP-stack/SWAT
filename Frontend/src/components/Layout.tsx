import React from 'react';
import Sidebar from './Dashboard/Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout-container">
      <Navbar />
      <div className="layout-wrapper">
        <Sidebar />
        <main className="layout-main">
          <div className="layout-content">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
