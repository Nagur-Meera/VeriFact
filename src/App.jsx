import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Chip,
  Stack,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  FactCheck,
  Psychology,
  GitHub,
  Notifications
} from '@mui/icons-material';

import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import FactChecker from './components/FactChecker';
import NewsBoard from './components/NewsBoard';
import Analytics from './components/Analytics';
import RealTimeUpdates from './components/RealTimeUpdates';

function App() {
  const handleGitHubClick = () => {
    window.open('https://github.com/Nagur-Meera/VeriFact', '_blank');
  };

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          {/* Enhanced Header */}
          <AppBar 
            position="static" 
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderBottom: '3px solid rgba(255,255,255,0.2)'
            }}
          >
            <Toolbar sx={{ py: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  width: 48,
                  height: 48
                }}>
                  <Psychology sx={{ fontSize: 28 }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h5" 
                    component="div" 
                    sx={{ 
                      fontWeight: 700,
                      letterSpacing: '-0.02em'
                    }}
                  >
                    VeriFact
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.9,
                      fontWeight: 400
                    }}
                  >
                    Real-time AI-powered fact-checking & misinformation detection
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Stack direction="row" spacing={1}>
                  <Chip 
                    label="🚀 v1.0.0" 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 600
                    }} 
                  />
                  <Chip 
                    label="🔥 Live" 
                    size="small" 
                    sx={{ 
                      bgcolor: '#ff4444',
                      color: 'white',
                      fontWeight: 600,
                      animation: 'pulse 2s infinite'
                    }} 
                  />
                </Stack>
                
                <Stack direction="row">
                  <Tooltip title="Notifications">
                    <IconButton color="inherit" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                      <Notifications />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View Source on GitHub">
                    <IconButton 
                      color="inherit" 
                      onClick={handleGitHubClick}
                      sx={{ color: 'rgba(255,255,255,0.9)' }}
                    >
                      <GitHub />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Toolbar>
          </AppBar>

          <Navigation />

          {/* Main Content with Background */}
          <Box sx={{
            minHeight: 'calc(100vh - 140px)',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="3" cy="3" r="3"/%3E%3C/g%3E%3C/svg%3E")',
              pointerEvents: 'none'
            }
          }}>
            <Container maxWidth="xl" sx={{ py: 4, position: 'relative' }}>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<FactChecker />} />
                  <Route path="/news" element={<NewsBoard />} />
                  <Route path="/analytics" element={<Analytics />} />
                </Routes>
              </ErrorBoundary>
            </Container>
          </Box>

          {/* Enhanced Real-time Updates Sidebar */}
          <Box
            sx={{
              position: 'fixed',
              right: 20,
              top: 140,
              width: 340,
              maxHeight: 'calc(100vh - 160px)',
              zIndex: 1000,
              display: { xs: 'none', lg: 'block' }
            }}
          >
            <ErrorBoundary>
              <RealTimeUpdates />
            </ErrorBoundary>
          </Box>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
