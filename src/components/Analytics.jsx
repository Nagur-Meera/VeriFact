import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getSystemStats, getTrendingTopics, getDailyActivity } from '../services/api';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [trending, setTrending] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [statsResponse, trendingResponse, activityResponse] = await Promise.all([
        getSystemStats(),
        getTrendingTopics(),
        getDailyActivity()
      ]);
      
      console.log('Analytics Data Received:');
      console.log('Stats:', statsResponse.data);
      console.log('Trending:', trendingResponse.data);
      console.log('Activity:', activityResponse.data);
      
      setStats(statsResponse.data.stats);
      setTrending(trendingResponse.data.trending || []);
      setDailyActivity(activityResponse.data.activity || []);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Sample data for demonstration
  const factCheckData = [
    { name: 'True', value: 45, color: '#4caf50' },
    { name: 'False', value: 25, color: '#f44336' },
    { name: 'Partially True', value: 20, color: '#ff9800' },
    { name: 'Unverified', value: 10, color: '#9e9e9e' }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mx: 'auto', maxWidth: 600 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        System Analytics
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {stats?.usage_stats?.factchecks_performed || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fact-Checks Performed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {stats?.usage_stats?.articles_analyzed || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Articles Analyzed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {stats?.vector_stats?.totalVectors || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stored Articles
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {Math.round(stats?.uptime / 3600) || 0}h
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System Uptime
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Fact-Check Results Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Fact-Check Results Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={factCheckData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {factCheckData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Daily Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Daily Activity (Last 7 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="factChecks" 
                  stroke="#1976d2" 
                  strokeWidth={2}
                  name="Fact-Checks"
                />
                <Line 
                  type="monotone" 
                  dataKey="articles" 
                  stroke="#dc004e" 
                  strokeWidth={2}
                  name="Articles Processed"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Trending Topics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Trending Topics {trending.length > 0 && `(${trending.length} topics)`}
            </Typography>
            {console.log('Rendering trending topics:', trending)}
            {trending.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trending}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="topic" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="frequency" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Alert severity="info">
                No trending topics data available
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Health
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Redis Connection</Typography>
                <Typography 
                  color={stats?.redis_connected ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 'bold' }}
                >
                  {stats?.redis_connected ? 'Connected' : 'Disconnected'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Vector Database</Typography>
                <Typography 
                  color={stats?.vector_stats ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 'bold' }}
                >
                  {stats?.vector_stats ? 'Active' : 'Inactive'}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Index Dimension</Typography>
                <Typography sx={{ fontWeight: 'bold' }}>
                  {stats?.vector_stats?.dimension || 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Performance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Avg Response Time</Typography>
                <Typography sx={{ fontWeight: 'bold' }}>
                  ~2.3s
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>Cache Hit Rate</Typography>
                <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  87%
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>API Success Rate</Typography>
                <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  99.2%
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
