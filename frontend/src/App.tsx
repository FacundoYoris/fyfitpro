import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminRoute from './components/layout/AdminRoute';
import Login from './pages/auth/Login';
import Dashboard from './pages/admin/dashboard/Dashboard';
import Users from './pages/admin/users/Users';
import UserForm from './pages/admin/users/UserForm';
import UserDetail from './pages/admin/users/UserDetail';
import Plans from './pages/admin/plans/Plans';
import PlanForm from './pages/admin/plans/PlanForm';
import Exercises from './pages/admin/exercises/Exercises';
import Routines from './pages/admin/routines/Routines';
import RoutineForm from './pages/admin/routines/RoutineForm';
import Payments from './pages/admin/payments/Payments';
import Profile from './pages/user/Profile';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/profile" replace />} />
              <Route path="/profile" element={<Profile />} />
              
              <Route element={<AdminRoute />}>
                <Route path="/admin/dashboard" element={<Dashboard />} />
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/users/new" element={<UserForm />} />
                <Route path="/admin/users/:id" element={<UserDetail />} />
                <Route path="/admin/plans" element={<Plans />} />
                <Route path="/admin/plans/new" element={<PlanForm />} />
                <Route path="/admin/exercises" element={<Exercises />} />
                <Route path="/admin/routines" element={<Routines />} />
                <Route path="/admin/routines/new" element={<RoutineForm />} />
                <Route path="/admin/routines/:id" element={<RoutineForm />} />
                <Route path="/admin/payments" element={<Payments />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
