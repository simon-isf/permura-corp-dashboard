import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Building2, Edit, Trash2 } from 'lucide-react'
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany, Company } from '@/hooks/useCompanies'
import { Navigation } from '@/components/layout/Navigation'

const Companies: React.FC = () => {
  const { companies, loading, error } = useCompanies()
  const createCompanyMutation = useCreateCompany()
  const updateCompanyMutation = useUpdateCompany()
  const deleteCompanyMutation = useDeleteCompany()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)

  const [newCompany, setNewCompany] = useState({
    company_id: '',
    company_name: ''
  })

  const handleCreateCompany = async () => {
    if (!newCompany.company_id || !newCompany.company_name) return

    try {
      await createCompanyMutation.mutateAsync(newCompany)
      setIsCreateDialogOpen(false)
      setNewCompany({ company_id: '', company_name: '' })
    } catch (error) {
      // Error is handled by the mutation hook
    }
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company)
    setIsEditDialogOpen(true)
  }

  const handleUpdateCompany = async () => {
    if (!editingCompany) return

    try {
      await updateCompanyMutation.mutateAsync({
        companyId: editingCompany.id,
        updates: {
          company_id: editingCompany.company_id,
          company_name: editingCompany.company_name
        }
      })
      setIsEditDialogOpen(false)
      setEditingCompany(null)
    } catch (error) {
      // Error is handled by the mutation hook
    }
  }

  const handleDeleteCompany = async (companyId: string) => {
    try {
      await deleteCompanyMutation.mutateAsync(companyId)
    } catch (error) {
      // Error is handled by the mutation hook
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading companies...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">Error loading companies</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Companies</h1>
            <p className="text-muted-foreground">Manage company accounts and settings</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Company</DialogTitle>
                <DialogDescription>
                  Add a new company to the system. Company ID should be unique.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="company_id">Company ID</Label>
                  <Input
                    id="company_id"
                    placeholder="Enter unique company ID"
                    value={newCompany.company_id}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, company_id: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    placeholder="Enter company name"
                    value={newCompany.company_name}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, company_name: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCompany}
                  disabled={!newCompany.company_id || !newCompany.company_name || createCompanyMutation.isPending}
                >
                  {createCompanyMutation.isPending ? 'Creating...' : 'Create Company'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Company Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Company</DialogTitle>
                <DialogDescription>
                  Update the company information. Company ID should be unique.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_company_id">Company ID</Label>
                  <Input
                    id="edit_company_id"
                    placeholder="Enter unique company ID"
                    value={editingCompany?.company_id || ''}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, company_id: e.target.value } : null)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_company_name">Company Name</Label>
                  <Input
                    id="edit_company_name"
                    placeholder="Enter company name"
                    value={editingCompany?.company_name || ''}
                    onChange={(e) => setEditingCompany(prev => prev ? { ...prev, company_name: e.target.value } : null)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateCompany}
                  disabled={!editingCompany?.company_id || !editingCompany?.company_name || updateCompanyMutation.isPending}
                >
                  {updateCompanyMutation.isPending ? 'Updating...' : 'Update Company'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{company.company_name}</CardTitle>
                      <CardDescription>ID: {company.company_id}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCompany(company)}
                      disabled={updateCompanyMutation.isPending}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deleteCompanyMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the company "{company.company_name}" and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCompany(company.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteCompanyMutation.isPending ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(company.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {companies.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No companies found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by adding your first company
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Companies
