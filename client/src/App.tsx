import { Switch, Route } from "wouter";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

// Create a simple version just to get initial rendering working
function App() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={() => (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Welcome to Kontent Fire</h1>
            <p className="mb-4">Please <a href="/auth" className="text-primary hover:underline">login or register</a> to get started</p>
          </div>
        </div>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
