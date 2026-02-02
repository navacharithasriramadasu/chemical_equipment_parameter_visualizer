import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';

const API_URL = "http://localhost:8000/api";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentDatasetId, setCurrentDatasetId] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchHistory();
    }
  }, []);

  // Configure axios to include token in requests
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    }
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login/`, { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      setIsAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Token ${res.data.token}`;
      fetchHistory();
    } catch (err) {
      alert('Login failed. Please check your credentials.');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/logout/`);
    } catch (err) {
      // Continue with logout even if API call fails
    }
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setData(null);
    setHistory([]);
    delete axios.defaults.headers.common['Authorization'];
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/history/`);
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file.");
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`${API_URL}/upload/`, formData);
      setCurrentDatasetId(res.data.id);
      const summary = await axios.get(`${API_URL}/summary/${res.data.id}/`);
      setData(summary.data);
      fetchHistory(); // Refresh history
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Session expired. Please login again.");
        handleLogout();
      } else {
        alert("Error uploading file.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = async (datasetId) => {
    try {
      const summary = await axios.get(`${API_URL}/summary/${datasetId}/`);
      setData(summary.data);
      setCurrentDatasetId(datasetId);
    } catch (err) {
      alert("Error loading dataset.");
    }
  };

  const downloadPDF = async () => {
    if (!currentDatasetId) {
      alert("No dataset selected.");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/pdf/${currentDatasetId}/`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${currentDatasetId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Error generating PDF.");
    }
  };

  // Login Form
  if (!isAuthenticated) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h2 style={styles.loginTitle}>Chemical Equipment Visualizer</h2>
          <p style={styles.loginSubtitle}>Please login to continue</p>
          <form onSubmit={handleLogin} style={styles.loginForm}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
            <button type="submit" style={styles.loginBtn}>Login</button>
          </form>
          <p style={styles.loginNote}>Demo credentials : un - admin , pwd - admin</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appWrapper}>
      {/* LEFT SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <h2 style={styles.brandName}>Chemical Equipment Visualizer</h2>
          <div style={styles.userInfo}>
            <span>{localStorage.getItem('username')}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          </div>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.label}>Import Data</label>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])} 
            style={styles.fileInput} 
            accept=".csv"
          />
          <button 
            onClick={handleUpload} 
            style={styles.actionBtn}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Upload & Sync'}
          </button>
        </div>

        {/* History Section */}
        <div style={styles.historySection}>
          <label style={styles.label}>History (Last 5)</label>
          <div style={styles.historyList}>
            {history.length === 0 ? (
              <p style={styles.noHistory}>No uploads yet</p>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id} 
                  style={{
                    ...styles.historyItem,
                    backgroundColor: currentDatasetId === item.id ? '#3b82f6' : '#334155'
                  }}
                  onClick={() => loadHistoryItem(item.id)}
                >
                  <div style={styles.historyName}>{item.name}</div>
                  <div style={styles.historyMeta}>
                    <span>{item.total_count} units</span>
                    <span>{new Date(item.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={styles.mainContent}>
        {data ? (
          <div style={styles.dashboardContainer}>
            <header style={styles.header}>
              <h1 style={styles.headerTitle}>Equipment Analytics Dashboard</h1>
              <div style={styles.headerActions}>
                <button onClick={downloadPDF} style={styles.pdfBtn}>
                  📄 Download PDF Report
                </button>
                <div style={styles.statusBadge}>System Active</div>
              </div>
            </header>

            {/* Stats Bar */}
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Total Units</span>
                <span style={styles.statValue}>{data.total_count}</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Avg Temperature</span>
                <span style={{...styles.statValue, color: '#e63946'}}>
                  {data.averages.avg_temp.toFixed(2)} °C
                </span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statLabel}>Avg Pressure</span>
                <span style={{...styles.statValue, color: '#457b9d'}}>
                  {data.averages.avg_press.toFixed(2)} Pa
                </span>
              </div>
            </div>

            {/* Charts Area */}
            <div style={styles.visualGrid}>
              <div style={styles.chartBox}>
                <h3 style={styles.chartTitle}>Distribution by Type</h3>
                <div style={{height: '300px'}}>
                  <Pie 
                    data={{
                      labels: data.distribution.map(d => d.eq_type),
                      datasets: [{
                        data: data.distribution.map(d => d.count),
                        backgroundColor: ['#4338ca', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                        borderWidth: 0
                      }]
                    }}
                    options={{ maintainAspectRatio: false }}
                  />
                </div>
              </div>
              
              <div style={styles.chartBox}>
                <h3 style={styles.chartTitle}>Raw Data Preview</h3>
                <div style={styles.tableScroll}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thRow}>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Temp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.raw_data.slice(0, 10).map((item, idx) => (
                        <tr key={idx} style={styles.tr}>
                          <td>{item.name}</td>
                          <td>{item.eq_type}</td>
                          <td>{item.temperature}°C</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.emptyContainer}>
            <div style={styles.emptyBox}>
              <h2 style={{fontSize: '40px', margin: '0'}}>📂</h2>
              <h3>Ready for Analysis</h3>
              <p>Please use the sidebar to upload your <b>CSV Files</b> or select from history.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  loginContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f1f5f9'
  },
  loginBox: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    width: '400px'
  },
  loginTitle: {
    margin: '0 0 10px 0',
    color: '#1e293b',
    fontSize: '1.8rem'
  },
  loginSubtitle: {
    color: '#64748b',
    marginBottom: '30px'
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '1rem'
  },
  loginBtn: {
    padding: '12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  loginNote: {
    marginTop: '20px',
    fontSize: '0.85rem',
    color: '#94a3b8',
    textAlign: 'center'
  },
  appWrapper: { 
    display: 'flex', 
    height: '100vh', 
    width: '100vw', 
    backgroundColor: '#f1f5f9', 
    overflow: 'hidden', 
    margin: 0 
  },
  sidebar: { 
    width: '280px', 
    backgroundColor: '#1e293b', 
    color: 'white', 
    display: 'flex', 
    flexDirection: 'column', 
    padding: '30px', 
    boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
    overflowY: 'auto'
  },
  brand: { 
    marginBottom: '30px' 
  },
  brandName: { 
    margin: '0 0 15px 0', 
    fontSize: '1.2rem', 
    letterSpacing: '1px' 
  },
  userInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem',
    color: '#94a3b8'
  },
  logoutBtn: {
    padding: '5px 10px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.75rem'
  },
  label: { 
    fontSize: '0.75rem', 
    color: '#94a3b8', 
    textTransform: 'uppercase', 
    marginBottom: '10px', 
    display: 'block' 
  },
  fileInput: { 
    color: '#94a3b8', 
    fontSize: '0.8rem', 
    marginBottom: '20px', 
    width: '100%' 
  },
  actionBtn: { 
    width: '100%', 
    padding: '12px', 
    backgroundColor: '#3b82f6', 
    color: 'white', 
    border: 'none', 
    borderRadius: '6px', 
    fontWeight: '600', 
    cursor: 'pointer' 
  },
  historySection: {
    marginTop: '30px',
    flex: 1
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '400px',
    overflowY: 'auto'
  },
  historyItem: {
    padding: '12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  historyName: {
    fontSize: '0.9rem',
    fontWeight: '600',
    marginBottom: '5px'
  },
  historyMeta: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    display: 'flex',
    justifyContent: 'space-between'
  },
  noHistory: {
    color: '#64748b',
    fontSize: '0.85rem',
    textAlign: 'center',
    padding: '20px'
  },
  mainContent: { 
    flex: 1, 
    height: '100vh', 
    overflowY: 'auto' 
  },
  dashboardContainer: { 
    padding: '40px' 
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '30px' 
  },
  headerTitle: { 
    fontSize: '1.8rem', 
    color: '#0f172a', 
    margin: 0 
  },
  headerActions: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
  },
  pdfBtn: {
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  statusBadge: { 
    backgroundColor: '#dcfce7', 
    color: '#166534', 
    padding: '5px 12px', 
    borderRadius: '20px', 
    fontSize: '0.8rem', 
    fontWeight: '600' 
  },
  statsRow: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(3, 1fr)', 
    gap: '20px', 
    marginBottom: '30px' 
  },
  statCard: { 
    backgroundColor: 'white', 
    padding: '20px', 
    borderRadius: '12px', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)', 
    display: 'flex', 
    flexDirection: 'column' 
  },
  statLabel: { 
    color: '#64748b', 
    fontSize: '0.85rem', 
    marginBottom: '5px' 
  },
  statValue: { 
    fontSize: '1.8rem', 
    fontWeight: '800', 
    color: '#1e293b' 
  },
  visualGrid: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '25px' 
  },
  chartBox: { 
    backgroundColor: 'white', 
    padding: '25px', 
    borderRadius: '15px', 
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
  },
  chartTitle: { 
    margin: '0 0 20px 0', 
    fontSize: '1rem', 
    color: '#475569' 
  },
  emptyContainer: { 
    height: '100%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emptyBox: { 
    textAlign: 'center', 
    color: '#94a3b8' 
  },
  tableScroll: { 
    maxHeight: '300px', 
    overflowY: 'auto' 
  },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse', 
    textAlign: 'left' 
  },
  thRow: { 
    borderBottom: '2px solid #f1f5f9', 
    color: '#64748b', 
    fontSize: '0.8rem' 
  },
  tr: { 
    borderBottom: '1px solid #f8fafc' 
  },
};

export default App;
