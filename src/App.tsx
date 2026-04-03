import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PurchasesPage } from './pages/PurchasesPage';
import { ScannerPage } from './pages/ScannerPage';
import { PurchaseDetails } from './pages/PurchaseDetails';
import { SearchPage } from './pages/SearchPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/history" element={<PurchasesPage />} />
        <Route path="/scan" element={<ScannerPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/purchase/:id" element={<PurchaseDetails />} />
      </Routes>
    </Layout>
  );
}

export default App;
