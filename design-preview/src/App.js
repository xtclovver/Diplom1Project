import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import Header from './Header';
import Footer from './Footer';
import HomePage from './HomePage';

function App() {
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
}

export default App;