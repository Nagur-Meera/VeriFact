import React from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { Refresh } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The application encountered an unexpected error
            </Typography>
          </Alert>
          
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Reload Page
          </Button>

          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                Error Details:
              </Typography>
              <pre style={{ fontSize: '12px', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
