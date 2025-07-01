import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Calendar from "./Calendar";

import Messages from "./Messages";

import Profile from "./Profile";

import Feedback from "./Feedback";

import Contracts from "./Contracts";

import Payroll from "./Payroll";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Calendar: Calendar,
    
    Messages: Messages,
    
    Profile: Profile,
    
    Feedback: Feedback,
    
    Contracts: Contracts,
    
    Payroll: Payroll,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Calendar" element={<Calendar />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Feedback" element={<Feedback />} />
                
                <Route path="/Contracts" element={<Contracts />} />
                
                <Route path="/Payroll" element={<Payroll />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}