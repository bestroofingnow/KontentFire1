import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: any[];
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in its child component tree
 * and displays a fallback UI instead of crashing the whole app
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  // This method is called when an error is thrown in a child component
  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  // This method is called after an error is thrown in a child component
  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Update state to store the error info
    this.setState({ errorInfo });
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  // Reset the error boundary when resetKeys change
  public componentDidUpdate(prevProps: Props): void {
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])
    ) {
      this.reset();
    }
  }

  // Method to reset the error boundary
  private reset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render(): ReactNode {
    // If there's an error, show the fallback UI
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise, use the default fallback UI
      return (
        <Card className="w-full max-w-md mx-auto my-8 border-destructive">
          <CardHeader className="bg-destructive/10 text-destructive">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle>Something went wrong</CardTitle>
            </div>
            <CardDescription className="text-destructive/80">
              An error occurred in this component
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-4">
              <p>We've encountered an unexpected error. You can try the following:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Reload the page</li>
                <li>Check your internet connection</li>
                <li>Try again later</li>
              </ul>
            </div>
            
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="mt-4">
                <p className="font-semibold text-sm">Error details (development only):</p>
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-[15vh]">
                  {this.state.error.toString()}
                </pre>
                
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer">Component stack</summary>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-[15vh]">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2 bg-muted/20">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Button onClick={this.reset}>
              Try Again
            </Button>
          </CardFooter>
        </Card>
      );
    }

    // Otherwise, render children normally
    return this.props.children;
  }
}

/**
 * A higher-order component that wraps a component with an ErrorBoundary
 * 
 * @example
 * const SafeComponent = withErrorBoundary(MyComponent);
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  // Set display name for debugging purposes
  const displayName = Component.displayName || Component.name || 'Component';
  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`;
  
  return WithErrorBoundary;
}