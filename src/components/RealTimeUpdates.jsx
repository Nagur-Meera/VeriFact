import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Avatar,
  Divider,
  Badge,
  Fade,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  CheckCircle, 
  Warning, 
  Error,
  Notifications,
  Psychology,
  Article,
  AccessTime,
  TrendingUp,
  Security,
  Close,
  Refresh
} from '@mui/icons-material';
import { io } from 'socket.io-client';

const RealTimeUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [connected, setConnected] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    // Check if we're in a serverless environment (like Vercel)
    const isServerless = window.location.hostname.includes('vercel.app') || 
                        window.location.hostname.includes('netlify.app');
    
    if (isServerless) {
      console.log('Serverless environment detected - WebSocket connections not supported');
      setConnected(false);
      
      // Add a message about limited real-time functionality
      setUpdates(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Real-time updates disabled in serverless deployment',
          type: 'info'
        }
      }]);
      
      return; // Don't try to connect to Socket.IO
    }

    // Determine the correct API URL for Socket.IO connection
    const getSocketUrl = () => {
      // Check if we're in development mode
      const isDev = import.meta.env.DEV;
      
      if (isDev) {
        console.log('Development mode detected, using localhost');
        return 'http://localhost:5000';
      }
      
      // In production, use the environment variable or fallback to Render URL
      const apiUrl = import.meta.env.VITE_API_URL || 'https://verifact-fiu4.onrender.com';
      console.log('Production mode, using:', apiUrl);
      console.log('Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
      return apiUrl;
    };

    const socketUrl = getSocketUrl();
    console.log('Connecting to Socket.IO at:', socketUrl);
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to real-time updates');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('factcheck_result', (data) => {
      setUpdates(prev => [{
        id: Date.now(),
        type: 'factcheck',
        data,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 9)]); // Keep only last 10 updates
    });

    socket.on('misinformation_alert', (data) => {
      setUpdates(prev => [{
        id: Date.now(),
        type: 'misinformation',
        data,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 9)]);
    });

    socket.on('news_update', (data) => {
      setUpdates(prev => [{
        id: Date.now(),
        type: 'news',
        data,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 9)]);
    });

    return () => socket.disconnect();
  }, []);

  const getUpdateColor = (type) => {
    switch (type) {
      case 'factcheck': return 'info';
      case 'misinformation': return 'error';
      case 'news': return 'success';
      default: return 'default';
    }
  };

  const getUpdateIcon = (type) => {
    switch (type) {
      case 'factcheck': return <Psychology />;
      case 'misinformation': return <Error />;
      case 'news': return <Article />;
      default: return <CheckCircle />;
    }
  };

  const getUpdateBackground = (type) => {
    switch (type) {
      case 'factcheck': return 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(21, 101, 192, 0.1) 100%)';
      case 'misinformation': return 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(198, 40, 40, 0.1) 100%)';
      case 'news': return 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%)';
      default: return 'rgba(0, 0, 0, 0.05)';
    }
  };

  const clearUpdates = () => {
    setUpdates([]);
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  };

  return (
    <Fade in timeout={1000}>
      <Paper 
        elevation={8} 
        sx={{ 
          borderRadius: 4,
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 2
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                width: 32,
                height: 32
              }}>
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Live Feed
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Real-time updates
                </Typography>
              </Box>
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <Badge 
                color={connected ? 'success' : 'error'} 
                variant="dot"
                sx={{
                  '& .MuiBadge-dot': {
                    animation: connected ? 'pulse 2s infinite' : 'none'
                  }
                }}
              >
                <Security sx={{ fontSize: 20 }} />
              </Badge>
              
              <Tooltip title="Clear updates">
                <IconButton 
                  size="small" 
                  onClick={clearUpdates}
                  sx={{ color: 'white' }}
                >
                  <Refresh sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={minimized ? "Expand" : "Minimize"}>
                <IconButton 
                  size="small" 
                  onClick={() => setMinimized(!minimized)}
                  sx={{ color: 'white' }}
                >
                  <Close sx={{ 
                    fontSize: 18,
                    transform: minimized ? 'rotate(45deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                  }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
          
          {/* Connection Status */}
          <Box sx={{ mt: 2 }}>
            <Chip
              label={connected ? '🟢 Connected' : '🔴 Disconnected'}
              size="small"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 500
              }}
            />
            <Chip
              label={`${updates.length} updates`}
              size="small"
              sx={{ 
                ml: 1,
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 500
              }}
            />
          </Box>
        </Box>

        {/* Content */}
        {!minimized && (
          <Box sx={{ 
            maxHeight: 400, 
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.05)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '3px',
            }
          }}>
            {updates.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Avatar sx={{ 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'grey.100',
                  width: 60,
                  height: 60
                }}>
                  <Notifications sx={{ fontSize: 30, color: 'grey.400' }} />
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  No recent updates
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Real-time notifications will appear here
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 1 }}>
                {updates.map((update, index) => (
                  <Fade in key={update.id} timeout={500} style={{ transitionDelay: `${index * 100}ms` }}>
                    <ListItem sx={{ px: 1, py: 0.5 }}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          width: '100%',
                          borderRadius: 3,
                          background: getUpdateBackground(update.type),
                          border: 'none',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateX(5px)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Stack direction="row" alignItems="flex-start" spacing={2}>
                            <Avatar sx={{ 
                              bgcolor: `${getUpdateColor(update.type)}.main`,
                              width: 36,
                              height: 36
                            }}>
                              {getUpdateIcon(update.type)}
                            </Avatar>
                            
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                                <Chip
                                  label={update.type.toUpperCase()}
                                  size="small"
                                  color={getUpdateColor(update.type)}
                                  sx={{ 
                                    fontSize: '0.7rem',
                                    height: 20,
                                    fontWeight: 600
                                  }}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <AccessTime sx={{ fontSize: 12, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {formatTimeAgo(update.timestamp)}
                                  </Typography>
                                </Box>
                              </Stack>
                              
                              {update.type === 'factcheck' && (
                                <Box>
                                  <Typography variant="body2" fontWeight="500" sx={{ mb: 0.5 }}>
                                    Fact-check completed
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary" 
                                    sx={{ 
                                      display: 'block',
                                      mb: 1,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    "{update.data.claim}"
                                  </Typography>
                                  <Chip 
                                    label={update.data.verdict}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                </Box>
                              )}
                              
                              {update.type === 'misinformation' && (
                                <Box>
                                  <Typography variant="body2" fontWeight="500" color="error" sx={{ mb: 0.5 }}>
                                    🚨 Misinformation Alert
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary" 
                                    sx={{ 
                                      display: 'block',
                                      mb: 1,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {update.data.title}
                                  </Typography>
                                  <Chip
                                    label={`Score: ${update.data.score}/100`}
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem', height: 20 }}
                                  />
                                </Box>
                              )}
                              
                              {update.type === 'news' && (
                                <Box>
                                  <Typography variant="body2" fontWeight="500" sx={{ mb: 0.5 }}>
                                    📰 New Article
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ 
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      display: 'block'
                                    }}
                                  >
                                    {update.data.title}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </ListItem>
                  </Fade>
                ))}
              </List>
            )}
          </Box>
        )}
      </Paper>
    </Fade>
  );
};

export default RealTimeUpdates;
