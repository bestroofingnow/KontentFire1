import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, MoreHorizontal, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

type User = {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  plan: 'blaze' | 'inferno';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  isAdmin: boolean;
};

export default function UserTable() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPlan, setNewPlan] = useState<string>("");
  
  // Fetch users
  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      return response.json();
    }
  });
  
  // Update user plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: number, plan: string }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${userId}/plan`, { plan });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setEditModalOpen(false);
      setSelectedUser(null);
      toast({
        title: "Plan Updated",
        description: "User plan has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Filter users based on search query
  useEffect(() => {
    if (!users) return;
    
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      user => 
        user.username.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
    );
    
    setFilteredUsers(filtered);
  }, [users, searchQuery]);
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setNewPlan(user.plan);
    setEditModalOpen(true);
  };
  
  const handleUpdatePlan = () => {
    if (!selectedUser) return;
    
    updatePlanMutation.mutate({
      userId: selectedUser.id,
      plan: newPlan
    });
  };
  
  if (error) {
    toast({
      title: "Error",
      description: "Failed to load users",
      variant: "destructive",
    });
  }

  return (
    <div>
      {/* Search and Filter */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </div>
      
      {/* Users Table */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-gray-500">Loading users...</p>
        </div>
      ) : filteredUsers && filteredUsers.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>
                    {user.username}
                    {user.isAdmin && (
                      <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
                        Admin
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge 
                      className={user.plan === 'blaze' ? 'bg-secondary text-dark' : 'bg-primary text-white'}
                    >
                      {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    {user.stripeSubscriptionId ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        No Subscription
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Change Plan</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md">
          <p className="text-gray-500">No users found</p>
        </div>
      )}
      
      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change User Plan</DialogTitle>
            <DialogDescription>
              {selectedUser && `Update plan for ${selectedUser.username}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Plan:</label>
              <p>
                <Badge 
                  className={selectedUser?.plan === 'blaze' ? 'bg-secondary text-dark' : 'bg-primary text-white'}
                >
                  {selectedUser?.plan === 'blaze' ? 'Blaze' : 'Inferno'}
                </Badge>
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">New Plan:</label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blaze">Blaze ($99/month)</SelectItem>
                  <SelectItem value="inferno">Inferno (Premium)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleUpdatePlan} 
              className="bg-primary hover:bg-primary-dark"
              disabled={updatePlanMutation.isPending || newPlan === selectedUser?.plan}
            >
              {updatePlanMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
