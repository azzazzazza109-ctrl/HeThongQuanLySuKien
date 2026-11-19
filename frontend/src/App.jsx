import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import MainLayout from './components/layout/MainLayout.jsx';
import Login from './pages/Login.jsx';
import EventList from './pages/EventList.jsx';
import CreateEvent from './pages/CreateEvent.jsx';
import MyTickets from './pages/MyTickets.jsx';
import EventDetail from './pages/EventDetail.jsx';
import Register from './pages/Register.jsx';
import StaffCheckin from './pages/StaffCheckin.jsx';
import AdminApprovals from './pages/admin/AdminApprovals.jsx';
import ManageTasks from './pages/ManageTasks.jsx';
import AdminEvents from './pages/admin/AdminEvents.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<EventList />} />
              <Route path="events/:id" element={<EventDetail />} />
              <Route path="my-tickets" element={<MyTickets />} />

              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
                <Route path="staff/checkin" element={<StaffCheckin />} />
                <Route path="admin/create" element={<CreateEvent />} />
                <Route path="admin/tasks" element={<ManageTasks />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="admin/dashboard" element={<AdminDashboard />} />
                <Route path="admin/approvals" element={<AdminApprovals />} />
                <Route path="admin/events" element={<AdminEvents />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;