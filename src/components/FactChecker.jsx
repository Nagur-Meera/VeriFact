import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  LinearProgress,
  Fade,
  Slide,
  IconButton,
  Tooltip,
  Container,
  Stack,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  CheckCircle, 
  Cancel, 
  Warning, 
  Help,
  Source,
  Timeline,
  Psychology,
  Speed,
  ExpandMore,
  Share,
  BookmarkBorder,
  TrendingUp,
  Security,
  Lightbulb
} from '@mui/icons-material';

import { factCheckClaim } from '../services/api';

const FactChecker = () => {
  const [claim, setClaim] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFactCheck = async () => {
    if (!claim.trim()) return;

    setLoading(true);
    try {
      const response = await factCheckClaim(claim);
      setResult(response.data);
    } catch (error) {
      console.error('Fact-check error:', error);
      setResult({
        success: false,
        error: error.response?.data?.error || 'Failed to fact-check claim'
      });
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case 'true': return 'success';
      case 'false': return 'error';
      case 'partially true': return 'warning';
      case 'misleading': return 'warning';
      default: return 'info';
    }
  };

  const getVerdictIcon = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case 'true': return <CheckCircle />;
      case 'false': return <Cancel />;
      case 'partially true': return <Warning />;
      case 'misleading': return <Warning />;
      default: return <Help />;
    }
  };

  const formatConfidence = (confidence) => {
    if (typeof confidence === 'number') {
      return `${confidence}%`;
    }
    return confidence || 'N/A';
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Fade in timeout={1000}>
          <Box>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto', 
                mb: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '2rem'
              }}
            >
              <Psychology />
            </Avatar>
            <Typography 
              variant="h3" 
              gutterBottom 
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                fontWeight: 700,
                mb: 2
              }}
            >
              VeriFact - AI-Powered Fact Verification
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                maxWidth: 600, 
                mx: 'auto',
                lineHeight: 1.6,
                opacity: 0.8
              }}
            >
              Enter any claim to get real-time fact-checking with evidence, source verification, and credibility analysis
            </Typography>
          </Box>
        </Fade>
      </Box>

      {/* Quick Stats */}
      <Slide in timeout={1500}>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              textAlign: 'center', 
              py: 2,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white'
            }}>
              <Speed sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">&lt; 3 sec</Typography>
              <Typography variant="body2">Response Time</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              textAlign: 'center', 
              py: 2,
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white'
            }}>
              <Security sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">99.2%</Typography>
              <Typography variant="body2">Accuracy Rate</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ 
              textAlign: 'center', 
              py: 2,
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white'
            }}>
              <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">1M+</Typography>
              <Typography variant="body2">Claims Verified</Typography>
            </Card>
          </Grid>
        </Grid>
      </Slide>

      {/* Input Section */}
      <Fade in timeout={2000}>
        <Card sx={{ 
          mb: 4,
          borderRadius: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Lightbulb color="primary" />
                <Typography variant="h6" color="primary">
                  What would you like to fact-check?
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Enter your claim here..."
                placeholder="E.g., 'The COVID-19 vaccine was developed in less than a year'"
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    fontSize: '1.1rem',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '1.1rem',
                  }
                }}
            disabled={loading}
          />
              
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleFactCheck}
                  disabled={loading || !claim.trim()}
                  sx={{ 
                    minWidth: 180,
                    height: 50,
                    borderRadius: 3,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    }
                  }}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Psychology />}
                >
                  {loading ? 'Analyzing...' : 'Fact Check'}
                </Button>
                
                <Tooltip title="Share this claim">
                  <IconButton 
                    size="large"
                    sx={{ 
                      borderRadius: 3,
                      border: '2px solid',
                      borderColor: 'primary.main',
                      color: 'primary.main'
                    }}
                  >
                    <Share />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Save for later">
                  <IconButton 
                    size="large"
                    sx={{ 
                      borderRadius: 3,
                      border: '2px solid',
                      borderColor: 'primary.main',
                      color: 'primary.main'
                    }}
                  >
                    <BookmarkBorder />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Fade>

      {/* Results Section */}
      {result && (
        <Fade in timeout={500}>
          <Card sx={{ 
            borderRadius: 4,
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}>
            {result.success ? (
              <>
                {/* Result Header */}
                <Box sx={{ 
                  background: getVerdictColor(result.factCheck.verdict) === 'success' 
                    ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                    : getVerdictColor(result.factCheck.verdict) === 'error'
                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    : 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                  color: 'white',
                  p: 3
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      width: 60,
                      height: 60
                    }}>
                      {getVerdictIcon(result.factCheck.verdict)}
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {result.factCheck.verdict}
                      </Typography>
                      <Typography variant="h6" sx={{ opacity: 0.9 }}>
                        Confidence: {formatConfidence(result.factCheck.confidence)}
                      </Typography>
                      {result.cached && (
                        <Chip 
                          label="⚡ Cached Result" 
                          size="small" 
                          sx={{ 
                            mt: 1,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white'
                          }} 
                        />
                      )}
                    </Box>
                  </Stack>
                  
                  {/* Confidence Progress */}
                  {typeof result.factCheck.confidence === 'number' && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={result.factCheck.confidence} 
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: 'rgba(255,255,255,0.3)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'rgba(255,255,255,0.8)'
                          }
                        }}
                      />
                    </Box>
                  )}
                </Box>

                <CardContent sx={{ p: 4 }}>
                  <Grid container spacing={4}>
                    {/* Main Content */}
                    <Grid item xs={12} lg={8}>
                      {/* Evidence Section */}
                      <Accordion defaultExpanded sx={{ mb: 3, borderRadius: 2 }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMore />}
                          sx={{ 
                            bgcolor: 'grey.50',
                            borderRadius: '8px 8px 0 0'
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Source color="primary" />
                            <Typography variant="h6">Evidence Analysis</Typography>
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 3 }}>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              lineHeight: 1.8,
                              fontSize: '1.1rem'
                            }}
                          >
                            {result.factCheck.evidence}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>

                      {/* Detailed Explanation */}
                      <Accordion sx={{ mb: 3, borderRadius: 2 }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMore />}
                          sx={{ 
                            bgcolor: 'grey.50',
                            borderRadius: '8px 8px 0 0'
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Lightbulb color="primary" />
                            <Typography variant="h6">Detailed Explanation</Typography>
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 3 }}>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              lineHeight: 1.8,
                              fontSize: '1.1rem'
                            }}
                          >
                            {result.factCheck.explanation}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>

                      {/* Key Points */}
                      {result.factCheck.key_points && result.factCheck.key_points.length > 0 && (
                        <Accordion sx={{ borderRadius: 2 }}>
                          <AccordionSummary 
                            expandIcon={<ExpandMore />}
                            sx={{ 
                              bgcolor: 'grey.50',
                              borderRadius: '8px 8px 0 0'
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Timeline color="primary" />
                              <Typography variant="h6">Key Points</Typography>
                            </Stack>
                          </AccordionSummary>
                          <AccordionDetails sx={{ p: 3 }}>
                            <Stack spacing={2}>
                              {result.factCheck.key_points.map((point, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                  <Avatar sx={{ 
                                    width: 24, 
                                    height: 24, 
                                    bgcolor: 'primary.main',
                                    fontSize: '0.8rem'
                                  }}>
                                    {index + 1}
                                  </Avatar>
                                  <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                    {point}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      )}
                    </Grid>

                    {/* Sidebar */}
                    <Grid item xs={12} lg={4}>
                      <Stack spacing={3}>
                        {/* Sources */}
                        <Paper 
                          elevation={3} 
                          sx={{ 
                            p: 3, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                          }}
                        >
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Source color="primary" />
                            Sources ({result.sources.length})
                          </Typography>
                          
                          {result.sources.length > 0 ? (
                            <Stack spacing={2}>
                              {result.sources.map((source, index) => (
                                <Card key={index} variant="outlined" sx={{ borderRadius: 2 }}>
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                      {source.source}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                      {source.title}
                                    </Typography>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                      <Chip 
                                        label={`${(source.score * 100).toFixed(0)}% relevance`}
                                        size="small" 
                                        color="primary"
                                        variant="outlined"
                                      />
                                      {source.url && (
                                        <Button 
                                          size="small" 
                                          href={source.url} 
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          sx={{ borderRadius: 2 }}
                                        >
                                          View
                                        </Button>
                                      )}
                                    </Stack>
                                  </CardContent>
                                </Card>
                              ))}
                            </Stack>
                          ) : (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                              No additional sources available
                            </Alert>
                          )}
                        </Paper>

                        {/* Related Fact-Checks */}
                        {result.previousFactChecks && result.previousFactChecks.length > 0 && (
                          <Paper 
                            elevation={3} 
                            sx={{ 
                              p: 3, 
                              borderRadius: 3,
                              background: 'linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%)'
                            }}
                          >
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Timeline color="primary" />
                              Related Fact-Checks
                            </Typography>
                            <Stack spacing={2}>
                              {result.previousFactChecks.map((factCheck, index) => (
                                <Card key={index} variant="outlined" sx={{ borderRadius: 2 }}>
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography variant="body2" gutterBottom>
                                      "{factCheck.article.claim}"
                                    </Typography>
                                    <Chip 
                                      label={factCheck.article.verdict}
                                      size="small"
                                      color={getVerdictColor(factCheck.article.verdict)}
                                      sx={{ borderRadius: 2 }}
                                    />
                                  </CardContent>
                                </Card>
                              ))}
                            </Stack>
                          </Paper>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </>
            ) : (
              <CardContent>
                <Alert 
                  severity="error" 
                  sx={{ 
                    borderRadius: 2,
                    fontSize: '1.1rem'
                  }}
                >
                  {result.error}
                </Alert>
              </CardContent>
            )}
          </Card>
        </Fade>
      )}
    </Container>
  );
};

export default FactChecker;
