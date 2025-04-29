import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import Header from './Header';
import Footer from './Footer';
import HomePage from './HomePage';

// Добавляем Font Awesome
const fontAwesome = document.createElement('link');
fontAwesome.rel = 'stylesheet';
fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.3.0/css/all.min.css';
document.head.appendChild(fontAwesome);

const App = () => {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <HomePage />
        </main>
        <Footer />
      </div>
    </Router>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />); 