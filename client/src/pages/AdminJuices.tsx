import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';

const AdminJuices = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentJuice, setCurrentJuice] = useState(null);
  const [newJuice, setNewJuice] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    imageUrl: '',
    featured: false,
  });

  // Fetch juices
  const { data: juices = [], isLoading } = useQuery({
    queryKey: ['/api/juices'],
  });

  // Add juice mutation
  const addJuiceMutation = useMutation({
    mutationFn: (juiceData) => apiRequest('POST', '/api/juices', juiceData),
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/juices']);
      setIsAddDialogOpen(false);
      resetForm();
    },
  });

  // Update juice mutation
  const updateJuiceMutation = useMutation({
    mutationFn: ({ id, data }) => apiRequest('PUT', `/api/juices/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/juices']);
      setIsEditDialogOpen(false);
    },
  });

  // Delete juice mutation
  const deleteJuiceMutation = useMutation({
    mutationFn: (id) => apiRequest('DELETE', `/api/juices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['/api/juices']);
      setIsDeleteDialogOpen(false);
    },
  });

  const resetForm = () => {
    setNewJuice({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      imageUrl: '',
      featured: false,
    });
  };

  const handleAddJuice = (e) => {
    e.preventDefault();
    // Convert price to cents
    const juiceData = {
      ...newJuice,
      price: Number(newJuice.price) * 100,
      stock: Number(newJuice.stock),
    };
    addJuiceMutation.mutate(juiceData);
  };

  const handleUpdateJuice = (e) => {
    e.preventDefault();
    if (!currentJuice) return;

    // Convert price to cents if it's not already
    const updatedJuice = {
      ...currentJuice,
      price: typeof currentJuice.price === 'string' 
        ? Number(currentJuice.price) * 100 
        : currentJuice.price,
      stock: Number(currentJuice.stock),
    };

    updateJuiceMutation.mutate({
      id: currentJuice.id,
      data: updatedJuice,
    });
  };

  const openEditDialog = (juice) => {
    // Convert price from cents to naira for editing
    setCurrentJuice({
      ...juice,
      price: (juice.price / 100).toFixed(2),
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (juice) => {
    setCurrentJuice(juice);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-8">Loading juices...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Juices</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add Juice
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {juices.map((juice) => (
                <TableRow key={juice.id}>
                  <TableCell>
                    <img
                      src={juice.imageUrl}
                      alt={juice.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{juice.name}</TableCell>
                  <TableCell>₦{(juice.price / 100).toFixed(2)}</TableCell>
                  <TableCell>{juice.stock}</TableCell>
                  <TableCell>{juice.featured ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(juice)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteDialog(juice)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {juices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No juices found. Add some to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Juice Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Juice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddJuice}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newJuice.name}
                  onChange={(e) =>
                    setNewJuice({ ...newJuice, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newJuice.description}
                  onChange={(e) =>
                    setNewJuice({ ...newJuice, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (₦)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newJuice.price}
                    onChange={(e) =>
                      setNewJuice({ ...newJuice, price: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newJuice.stock}
                    onChange={(e) =>
                      setNewJuice({ ...newJuice, stock: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={newJuice.imageUrl}
                  onChange={(e) =>
                    setNewJuice({ ...newJuice, imageUrl: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={newJuice.featured}
                  onCheckedChange={(checked) =>
                    setNewJuice({ ...newJuice, featured: checked })
                  }
                />
                <Label htmlFor="featured">Featured Product</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={addJuiceMutation.isPending}>
                {addJuiceMutation.isPending ? 'Adding...' : 'Add Juice'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Juice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Juice</DialogTitle>
          </DialogHeader>
          {currentJuice && (
            <form onSubmit={handleUpdateJuice}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={currentJuice.name}
                    onChange={(e) =>
                      setCurrentJuice({
                        ...currentJuice,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={currentJuice.description}
                    onChange={(e) =>
                      setCurrentJuice({
                        ...currentJuice,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Price (₦)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      value={currentJuice.price}
                      onChange={(e) =>
                        setCurrentJuice({
                          ...currentJuice,
                          price: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-stock">Stock</Label>
                    <Input
                      id="edit-stock"
                      type="number"
                      value={currentJuice.stock}
                      onChange={(e) =>
                        setCurrentJuice({
                          ...currentJuice,
                          stock: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-imageUrl">Image URL</Label>
                  <Input
                    id="edit-imageUrl"
                    value={currentJuice.imageUrl}
                    onChange={(e) =>
                      setCurrentJuice({
                        ...currentJuice,
                        imageUrl: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-featured"
                    checked={currentJuice.featured}
                    onCheckedChange={(checked) =>
                      setCurrentJuice({
                        ...currentJuice,
                        featured: checked,
                      })
                    }
                  />
                  <Label htmlFor="edit-featured">Featured Product</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={updateJuiceMutation.isPending}
                >
                  {updateJuiceMutation.isPending
                    ? 'Updating...'
                    : 'Update Juice'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete{' '}
            <span className="font-semibold">
              {currentJuice?.name}
            </span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteJuiceMutation.mutate(currentJuice.id)}
              disabled={deleteJuiceMutation.isPending}
            >
              {deleteJuiceMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJuices; 