"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { User, UserFilters } from "@/lib/api/users-api";
import { usersService } from "@/services/usersService";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchIcon, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, MoreVertical, UserCheck, UserX, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useCsrf } from "@/hooks/use-csrf";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import Link from "next/link";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { withCsrfProtection } = useCsrf();
  
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<UserFilters>({
    skip: 0,
    take: 10,
    email: '',
    role: ''
  });
  
  // Alert dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Load users on mount and when filters change
  useEffect(() => {
    loadUsers();
  }, [filters]);
  
  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await usersService.getUsers(filters);
      if (response.success) {
        setUsers(response.data.users);
        setTotal(response.data.total);
      } else {
        setError(response.error || "Failed to load users");
        toast({
          variant: "destructive",
          title: "Error",
          description: response.error || "Failed to load users",
        });
      }
    } catch (err: any) {
      console.error("Failed to load users:", err);
      setError(err.message || "Failed to load users");
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to load users",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update filters when page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters(prev => ({
      ...prev,
      skip: (page - 1) * prev.take!
    }));
  };
  
  // Filter by email
  const handleEmailFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      email: e.target.value,
      skip: 0 // Reset to first page when filter changes
    }));
    setCurrentPage(1);
  };
  
  // Filter by role
  const handleRoleFilterChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      role: value === "ALL" ? "" : value,
      skip: 0 // Reset to first page when filter changes
    }));
    setCurrentPage(1);
  };
  
  // Action handlers
  const handleBlockUnblockUser = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      await withCsrfProtection(async () => {
        const newStatus = selectedUser.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
        const response = await usersService.updateUserStatus(selectedUser.id, newStatus);
        
        if (response.success) {
          toast({
            title: "Success",
            description: response.message,
          });
          loadUsers();
        } else {
          throw new Error(response.error);
        }
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update user status",
      });
    } finally {
      setActionLoading(false);
      setBlockDialogOpen(false);
      setSelectedUser(null);
    }
  };
  
  const handlePromoteToSeller = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      await withCsrfProtection(async () => {
        const response = await usersService.updateUserRole(selectedUser.id, 'SELLER');
        
        if (response.success) {
          toast({
            title: "Success",
            description: response.message,
          });
          loadUsers();
        } else {
          throw new Error(response.error);
        }
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to promote user",
      });
    } finally {
      setActionLoading(false);
      setPromoteDialogOpen(false);
      setSelectedUser(null);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      await withCsrfProtection(async () => {
        const response = await usersService.deleteUser(selectedUser.id);
        
        if (response.success) {
          toast({
            title: "Success",
            description: response.message,
          });
          loadUsers();
        } else {
          throw new Error(response.error);
        }
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete user",
      });
    } finally {
      setActionLoading(false);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(total / filters.take!);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-bold">Users</h1>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 w-full max-w-sm">
                <div className="relative w-full">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by email..."
                    className="pl-8"
                    value={filters.email || ''}
                    onChange={handleEmailFilterChange}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select 
                  value={filters.role ? filters.role : "ALL"} 
                  onValueChange={handleRoleFilterChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SELLER">Seller</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 p-4 mb-6 rounded">
                {error}
              </div>
            )}
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                        <div className="flex justify-center items-center h-full">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          <span className="ml-2">Loading users...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              user.role === 'ADMIN' ? 'default' : 
                              user.role === 'SELLER' ? 'secondary' : 
                              'outline'
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              user.status === 'ACTIVE' ? 'default' : 
                              user.status === 'BLOCKED' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <Link href={`/users/${user.id}/view`}>
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                              </Link>
                              <Link href={`/users/${user.id}`}>
                                <DropdownMenuItem>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuSeparator />
                              {user.role === 'USER' && user.status === 'ACTIVE' && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setPromoteDialogOpen(true);
                                  }}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Promote to Seller
                                </DropdownMenuItem>
                              )}
                              {user.id !== currentUser?.id && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setBlockDialogOpen(true);
                                  }}
                                  className={user.status === 'BLOCKED' ? 'text-green-600' : 'text-orange-600'}
                                >
                                  {user.status === 'BLOCKED' ? (
                                    <>
                                      <UserCheck className="mr-2 h-4 w-4" />
                                      Unblock User
                                    </>
                                  ) : (
                                    <>
                                      <UserX className="mr-2 h-4 w-4" />
                                      Block User
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}
                              {user.role !== 'ADMIN' && user.id !== currentUser?.id && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete User
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="mt-4 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, i, array) => (
                      <React.Fragment key={page}>
                        {i > 0 && array[i - 1] !== page - 1 && (
                          <span className="px-2">...</span>
                        )}
                        <Button 
                          variant={page === currentPage ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))
                  }
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Block/Unblock User Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.status === 'BLOCKED' ? 'Unblock User' : 'Block User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.status === 'BLOCKED' 
                ? `Are you sure you want to unblock "${selectedUser?.email}"? They will be able to access their account again.`
                : `Are you sure you want to block "${selectedUser?.email}"? They will not be able to access their account.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBlockUnblockUser}
              disabled={actionLoading}
              className={selectedUser?.status === 'BLOCKED' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {actionLoading ? 'Processing...' : selectedUser?.status === 'BLOCKED' ? 'Unblock' : 'Block'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote to Seller Dialog */}
      <AlertDialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote User to Seller</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to promote "{selectedUser?.email}" to SELLER? 
              This will grant them access to create and manage their own stores and products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePromoteToSeller}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Promote'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedUser?.email}"? 
              This action cannot be undone. All user data will be permanently removed.
              {selectedUser?.role === 'ADMIN' && (
                <span className="block mt-2 text-red-600 font-semibold">
                  Note: Admin users cannot be deleted for security reasons.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
} 