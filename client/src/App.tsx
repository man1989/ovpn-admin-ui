import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/LoginPage';
import Dashboard from './pages/DashboardPage';
import Clients from './pages/ClientManagementPage';
import Layout from './components/Layout';
import { isAuthenticated } from './utils/auth';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  console.log("isAuthenticated", isAuthenticated());
  return isAuthenticated() ? children : <Login />;
};

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
        }
      />      
      {/* <Route path="/" element={<Login />} /> */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <PrivateRoute>
            <Layout><Clients /></Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
