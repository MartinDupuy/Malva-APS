import React, { useState } from 'react';
import PaymentDemo from './components/PaymentDemo';
import DocsDemo from './components/DocsDemo';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('payment');

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-logo">✈️ Malva-APS</div>
        <nav className="header-nav">
          <button 
            className={`nav-btn ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            Pago de Vuelo (US3)
          </button>
          <button 
            className={`nav-btn ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
          >
            Documentación Visual
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'payment' && <PaymentDemo />}
        {activeTab === 'docs' && <DocsDemo />}
      </main>
    </div>
  );
}

export default App;
