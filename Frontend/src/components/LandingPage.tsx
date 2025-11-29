import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  BarChart3,
  AlertCircle,
  TrendingUp,
  Shield,
  Cpu,
  CheckCircle,
} from 'lucide-react';
import { FaArrowRight } from 'react-icons/fa';
import { MdOutlineBolt, MdOutlineAnalytics, MdOutlineWarning, MdOutlineTrendingUp, MdOutlineShield, MdOutlineMemory } from 'react-icons/md';
import { IoMdCheckmarkCircle } from 'react-icons/io';
import Navbar from './Navbar';
import Footer from './Footer';
import './LandingPage.css';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureProps> = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

interface ModelProps {
  name: string;
  description: string;
  accuracy: string;
  specialty: string;
  icon: React.ReactNode;
}

const ModelCard: React.FC<ModelProps> = ({ name, description, accuracy, specialty, icon }) => (
  <div className="model-card">
    <div className="model-icon">{icon}</div>
    <div className="model-badge">{specialty}</div>
    <h3>{name}</h3>
    <p className="model-description">{description}</p>
    <div className="model-accuracy">
      <span>Accuracy</span>
      <span className="accuracy-value">{accuracy}</span>
    </div>
  </div>
);

interface StepProps {
  number: number;
  title: string;
  description: string;
}

const StepCard: React.FC<StepProps> = ({ number, title, description }) => (
  <div className="step-card">
    <div className="step-number">{number}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('.features, .models, .how-it-works, .benefits, .cta-section');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      <Navbar />
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Real-Time Anomaly Detection for Water Systems
            </h1>
            <p className="hero-subtitle">
              Protect your industrial infrastructure with advanced ML-powered anomaly detection. Detect threats before they become critical issues.
            </p>
            <div className="hero-buttons">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/dashboard')}
              >
                Get Started <FaArrowRight size={18} />
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const section = document.getElementById('how-it-works');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Learn More
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-animation">
              <div className="animated-sphere"></div>
              <div className="animated-wave"></div>
              <div className="animated-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-header">
          <h2>Why Choose SWAT?</h2>
          <p>Comprehensive anomaly detection with powerful features</p>
        </div>
        <div className="features-grid">
          <FeatureCard
            icon={<MdOutlineBolt size={32} />}
            title="Real-Time Detection"
            description="Instantly identify anomalies in your water treatment system with sub-second response times"
          />
          <FeatureCard
            icon={<MdOutlineAnalytics size={32} />}
            title="Advanced Analytics"
            description="Detailed metrics, confusion matrices, and comprehensive evaluation reports"
          />
          <FeatureCard
            icon={<MdOutlineWarning size={32} />}
            title="Smart Alerts"
            description="Customizable alerts and notifications for immediate threat awareness"
          />
          <FeatureCard
            icon={<MdOutlineTrendingUp size={32} />}
            title="Trend Analysis"
            description="Monitor long-term patterns and anomaly evolution over time"
          />
          <FeatureCard
            icon={<MdOutlineShield size={32} />}
            title="Secure & Private"
            description="Enterprise-grade security with encrypted data storage and access control"
          />
          <FeatureCard
            icon={<MdOutlineMemory size={32} />}
            title="Multiple Models"
            description="Choose from diverse ML models optimized for different scenarios"
          />
        </div>
      </section>

      {/* Models Section */}
      <section id="models" className="models">
        <div className="section-header">
          <h2>Available Detection Models</h2>
          <p>Multiple specialized models for comprehensive anomaly detection</p>
        </div>
        <div className="models-grid">
          <ModelCard
            icon={<BarChart3 size={32} />}
            name="Granger ARIMA IQR"
            description="Combines Granger causality with ARIMA forecasting and IQR-based detection"
            accuracy="92%"
            specialty="Balanced"
          />
          <ModelCard
            icon={<Cpu size={32} />}
            name="ESD + Z-Score"
            description="Extreme Studentized Deviate with Z-score normalization for robust detection"
            accuracy="94%"
            specialty="High Precision"
          />
          <ModelCard
            icon={<TrendingUp size={32} />}
            name="Holt-Winters"
            description="Double exponential smoothing with adaptive thresholds for seasonal data"
            accuracy="91%"
            specialty="Seasonal"
          />
          <ModelCard
            icon={<AlertCircle size={32} />}
            name="High Sensitivity"
            description="Optimized for detecting subtle anomalies with lower false negatives"
            accuracy="89%"
            specialty="Sensitive"
          />
          <ModelCard
            icon={<Shield size={32} />}
            name="Optimized Granger"
            description="Fine-tuned Granger causality model with dynamic thresholding"
            accuracy="93%"
            specialty="Advanced"
          />
          <ModelCard
            icon={<Zap size={32} />}
            name="Rolling Quantile"
            description="Adaptive quantile-based approach for streaming data analysis"
            accuracy="90%"
            specialty="Streaming"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Simple, powerful anomaly detection in four steps</p>
        </div>
        <div className="steps-container">
          <StepCard
            number={1}
            title="Upload Data"
            description="Import your sensor data in CSV or Parquet format from your water treatment system"
          />
          <StepCard
            number={2}
            title="Select Model"
            description="Choose from multiple specialized detection models optimized for your use case"
          />
          <StepCard
            number={3}
            title="Analyze Results"
            description="Get detailed metrics, ROC curves, and confusion matrices in real-time"
          />
          <StepCard
            number={4}
            title="Take Action"
            description="Review alerts, generate reports, and integrate findings with your operations"
          />
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="benefits">
        <div className="section-header">
          <h2>Key Benefits</h2>
          <p>Transform your anomaly detection capabilities</p>
        </div>
        <div className="benefits-grid">
          <div className="benefit-item">
            <IoMdCheckmarkCircle size={24} />
            <h3>Prevent System Failures</h3>
            <p>Detect anomalies early before they cause critical system failures</p>
          </div>
          <div className="benefit-item">
            <IoMdCheckmarkCircle size={24} />
            <h3>Reduce Downtime</h3>
            <p>Minimize operational disruptions with proactive threat detection</p>
          </div>
          <div className="benefit-item">
            <IoMdCheckmarkCircle size={24} />
            <h3>Lower Costs</h3>
            <p>Save money through early detection and preventive maintenance</p>
          </div>
          <div className="benefit-item">
            <IoMdCheckmarkCircle size={24} />
            <h3>Improve Safety</h3>
            <p>Enhance water system safety and quality assurance</p>
          </div>
          <div className="benefit-item">
            <IoMdCheckmarkCircle size={24} />
            <h3>Easy Integration</h3>
            <p>Seamlessly integrate with existing monitoring systems</p>
          </div>
          <div className="benefit-item">
            <IoMdCheckmarkCircle size={24} />
            <h3>Expert Support</h3>
            <p>Access comprehensive documentation and technical support</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Protect Your Water System?</h2>
          <p>Start your free trial today and experience advanced anomaly detection</p>
          <button
            className="btn btn-large"
            onClick={() => navigate('/dashboard')}
          >
            Get Started <FaArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
