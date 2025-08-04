import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Tabs, 
  Tab, 
  Paper,
  Container,
  Chip,
  Badge,
  Typography
} from '@mui/material';
import { 
  FactCheck, 
  Article, 
  Analytics,
  TrendingUp,
  Security,
  Speed,
  VerifiedUser
} from '@mui/icons-material';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTabValue = () => {
    switch (location.pathname) {
      case '/': return 0;
      case '/news': return 1;
      case '/analytics': return 2;
      default: return 0;
    }
  };

  const handleTabChange = (event, newValue) => {
    const routes = ['/', '/news', '/analytics'];
    navigate(routes[newValue]);
  };

  const navigationItems = [
    {
      icon: <FactCheck />,
      label: "Fact Checker",
      description: "AI-powered verification",
      badge: "HOT"
    },
    {
      icon: <Article />,
      label: "News Board",
      description: "Real-time news feed",
      badge: null
    },
    {
      icon: <Analytics />,
      label: "Analytics",
      description: "System insights",
      badge: null
    }
  ];

  return (
    <Paper 
      elevation={4} 
      sx={{ 
        borderRadius: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderTop: '3px solid',
        borderImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%) 1'
      }}
    >
      <Container maxWidth="lg">
        {/* Logo and Brand Section */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          py: 2,
          borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}>
          <VerifiedUser sx={{ 
            fontSize: 32, 
            color: '#1976d2',
            mr: 1
          }} />
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}
          >
            VeriFact
          </Typography>
          <Chip 
            label="AI-Powered" 
            size="small" 
            sx={{ 
              ml: 2,
              bgcolor: '#4caf50',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem'
            }} 
          />
        </Box>
        
        <Box sx={{ py: 1 }}>
          <Tabs 
            value={getTabValue()} 
            onChange={handleTabChange} 
            variant="fullWidth"
            sx={{ 
              minHeight: 64,
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'all 0.3s ease',
                borderRadius: 2,
                mx: 0.5,
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  transform: 'translateY(-2px)',
                },
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  '& .MuiSvgIcon-root': {
                    color: 'white'
                  }
                }
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            {navigationItems.map((item, index) => (
              <Tab
                key={index}
                icon={
                  item.badge ? (
                    <Badge 
                      badgeContent={
                        <Chip 
                          label={item.badge} 
                          size="small" 
                          sx={{ 
                            height: 16,
                            fontSize: '0.6rem',
                            bgcolor: '#ff4444',
                            color: 'white'
                          }} 
                        />
                      }
                      sx={{
                        '& .MuiBadge-badge': {
                          right: -12,
                          top: 0
                        }
                      }}
                    >
                      {item.icon}
                    </Badge>
                  ) : item.icon
                }
                label={
                  <Box>
                    <Box sx={{ fontWeight: 600 }}>{item.label}</Box>
                    <Box sx={{ 
                      fontSize: '0.75rem', 
                      opacity: 0.7,
                      fontWeight: 400
                    }}>
                      {item.description}
                    </Box>
                  </Box>
                }
                iconPosition="top"
              />
            ))}
          </Tabs>
        </Box>
      </Container>
    </Paper>
  );
};

export default Navigation;
