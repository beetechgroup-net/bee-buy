import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { ScannerPage } from './pages/ScannerPage';
import { PurchaseDetails } from './pages/PurchaseDetails';
import { SearchPage } from './pages/SearchPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<ScannerPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/purchase/:id" element={<PurchaseDetails />} />
      </Routes>
    </Layout>
  );
}

export default App;
