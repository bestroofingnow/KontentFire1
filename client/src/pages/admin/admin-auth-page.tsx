import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Flame, ShieldCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 

// Admin login form schema
const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginData = z.infer<typeof adminLoginSchema>;

export default function AdminAuthPage() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [adminError, setAdminError] = useState<string | null>(null);

  // Admin login form
  const adminLoginForm = useForm<AdminLoginData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle admin login form submission
  const onAdminLoginSubmit = async (values: AdminLoginData) => {
    try {
      setIsLoggingIn(true);
      setAdminError(null);
      
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
        credentials: 'include', // Important to include cookies
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Admin login failed');
      }
      
      const userData = await response.json();
      
      // Check if the user is an admin
      if (!userData.isAdmin) {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      toast({
        title: "Admin Login Successful",
        description: `Welcome, Administrator ${userData.username}!`,
      });
      
      // Redirect to admin dashboard
      window.location.href = '/admin';
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Admin login failed. Please check your credentials.");
      
      toast({
        title: "Admin Login Failed",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-light flex flex-col md:flex-row">
      {/* Left side - Admin Auth form */}
      <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <div className="text-primary-dark font-bold text-4xl font-display tracking-tight inline-flex items-center mb-4">
              <span className="text-primary">Kontent</span>Fire
              <Flame className="ml-2 h-6 w-6 text-primary" />
            </div>
            <div className="flex justify-center">
              <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <ShieldCheck className="h-4 w-4 mr-1" />
                Admin Access Only
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Administrator Authentication</h1>
            <p className="text-gray-500 text-sm">Access the admin control panel</p>
          </div>
          
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md mb-4">
            <div className="flex items-center space-x-3 text-amber-600 mb-2">
              <ShieldCheck className="h-5 w-5" />
              <h3 className="font-medium">Restricted Area</h3>
            </div>
            <p className="text-sm text-gray-600">
              This section is exclusively for system administrators. Regular users should use the standard login page.
            </p>
          </div>
          
          {adminError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{adminError}</AlertDescription>
            </Alert>
          )}

          <Form {...adminLoginForm}>
            <form onSubmit={adminLoginForm.handleSubmit(onAdminLoginSubmit)} className="space-y-4">
              <FormField
                control={adminLoginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter admin username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={adminLoginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admin Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter admin password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Authenticating..." : "Access Admin Panel"}
              </Button>
            </form>
          </Form>

          <div className="text-center mt-6">
            <a 
              href="/" 
              className="text-sm text-gray-600 hover:text-primary"
            >
              Return to main application
            </a>
          </div>
        </div>
      </div>

      {/* Right side - Admin info section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-amber-600 to-amber-800 p-6 md:p-12 flex items-center justify-center hidden md:flex">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-6 font-display">Administrator Control Panel</h1>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg mt-1">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">System Management</h3>
                <p className="opacity-80">Configure platform settings, manage users, and monitor system health.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">User Management</h3>
                <p className="opacity-80">Manage user accounts, subscription plans, and access permissions.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
                <p className="opacity-80">Monitor platform usage metrics, content performance, and system resources.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}