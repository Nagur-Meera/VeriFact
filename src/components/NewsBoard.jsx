import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  Search,
  OpenInNew,
  Warning,
  CheckCircle,
  Schedule,
  Close
} from '@mui/icons-material';

import { getLatestNews, analyzeArticle } from '../services/api';

const NewsBoard = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('general');
  const [analysisDialog, setAnalysisDialog] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'business', label: 'Business' },
    { value: 'technology', label: 'Technology' },
    { value: 'health', label: 'Health' },
    { value: 'science', label: 'Science' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'sports', label: 'Sports' }
  ];

  useEffect(() => {
    fetchNews();
  }, [category]);

  const fetchNews = async (query = '') => {
    setLoading(true);
    try {
      const response = await getLatestNews(query || null, category);
      setArticles(response.data.articles || []);
    } catch (error) {
      console.error('Failed to fetch news:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchNews(searchQuery);
  };

  const handleAnalyzeArticle = async (article) => {
    setSelectedArticle(article);
    setAnalysisDialog(true);
    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await analyzeArticle({
        articleText: article.content || article.description,
        url: article.url,
        title: article.title
      });
      setAnalysisResult(response.data.analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisResult({
        error: error.response?.data?.error || 'Analysis failed'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getMisinformationColor = (score) => {
    if (score > 70) return 'error';
    if (score > 40) return 'warning';
    return 'success';
  };

  const getMisinformationIcon = (score) => {
    if (score > 70) return <Warning />;
    if (score > 40) return <Warning />;
    return <CheckCircle />;
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        Real-time News Board
      </Typography>

      {/* Search and Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search news"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={handleSearch}>
                      <Search />
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Category"
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => fetchNews(searchQuery)}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Refresh'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* News Articles Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={48} />
        </Box>
      ) : articles.length === 0 ? (
        <Alert severity="info">
          No news articles found. Try adjusting your search terms or category.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {articles.map((article, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card 
                className="news-card"
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {article.urlToImage && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={article.urlToImage}
                    alt={article.title}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip 
                      label={article.source} 
                      size="small" 
                      variant="outlined"
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Schedule sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(article.publishedAt)}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography 
                    variant="h6" 
                    component="h3" 
                    gutterBottom
                    sx={{ 
                      fontSize: '1rem',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {article.title}
                  </Typography>

                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 2
                    }}
                  >
                    {article.description}
                  </Typography>

                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Button
                          size="small"
                          variant="outlined"
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<OpenInNew />}
                          fullWidth
                        >
                          Read
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleAnalyzeArticle(article)}
                          disabled={!article.content && !article.description}
                          fullWidth
                        >
                          Analyze
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Analysis Dialog */}
      <Dialog 
        open={analysisDialog} 
        onClose={() => setAnalysisDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Article Analysis
            <IconButton onClick={() => setAnalysisDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedArticle && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {selectedArticle.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Source: {selectedArticle.source}
              </Typography>
            </Box>
          )}

          {analyzing ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : analysisResult ? (
            analysisResult.error ? (
              <Alert severity="error">{analysisResult.error}</Alert>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {getMisinformationIcon(analysisResult.misinformation_score)}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          Misinformation Score
                        </Typography>
                      </Box>
                      <Typography variant="h4" 
                        color={getMisinformationColor(analysisResult.misinformation_score)}
                      >
                        {analysisResult.misinformation_score}/100
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Bias Score
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {analysisResult.bias_score || 'N/A'}/100
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Analysis Summary
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {analysisResult.summary}
                  </Typography>
                </Grid>

                {analysisResult.red_flags && analysisResult.red_flags.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom color="error">
                      Red Flags
                    </Typography>
                    {analysisResult.red_flags.map((flag, index) => (
                      <Chip 
                        key={index}
                        label={flag}
                        color="error"
                        variant="outlined"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Grid>
                )}

                {analysisResult.strengths && analysisResult.strengths.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom color="success.main">
                      Strengths
                    </Typography>
                    {analysisResult.strengths.map((strength, index) => (
                      <Chip 
                        key={index}
                        label={strength}
                        color="success"
                        variant="outlined"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Grid>
                )}
              </Grid>
            )
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setAnalysisDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewsBoard;
