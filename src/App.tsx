import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthPage } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PatientDashboard } from './pages/PatientDashboard';
import { Patients } from './pages/Patients';
import { Doctors } from './pages/Doctors';
import { Appointments } from './pages/Appointments';
import { Departments } from './pages/Departments';
import { Rooms } from './pages/Rooms';
import { MedicalRecords } from './pages/MedicalRecords';
import { Bills } from './pages/Bills';
import { Prescriptions } from './pages/Prescriptions';

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderAdminPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'patients':
        return <Patients />;
      case 'doctors':
        return <Doctors />;
      case 'appointments':
        return <Appointments />;
      case 'prescriptions':
        return <Prescriptions />;
      case 'bills':
        return <Bills />;
      case 'departments':
        return <Departments />;
      case 'rooms':
        return <Rooms />;
      case 'records':
        return <MedicalRecords />;
      default:
        return <Dashboard />;
    }
  };

  const renderPatientPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <PatientDashboard />;
      case 'appointments':
        return <Appointments />;
      case 'prescriptions':
        return <Prescriptions />;
      case 'records':
        return <MedicalRecords />;
      case 'bills':
        return <Bills />;
      default:
        return <PatientDashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {isAdmin ? renderAdminPage() : renderPatientPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
