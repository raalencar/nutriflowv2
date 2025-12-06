import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Edit, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUsers,
  getUnits,
  getUserUnits,
  addUserUnit,
  removeUserUnit,
  updateUserRole,
} from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { User } from "@/types";
import { UpdateUserFormValues } from "@/lib/schemas";
import { UserAccessForm } from "@/components/forms/UserAccessForm";
import { InviteUserDialog } from "@/components/dialogs/InviteUserDialog";

// Role badge variant mapping
const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "admin":
      return "default"; // Red/primary
    case "manager":
      return "secondary"; // Blue
    case "operator":
      return "outline"; // Gray
    default:
      return "outline";
  }
};

export default function Colaboradores() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Queries
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });

  const { data: units = [] } = useQuery({
    queryKey: ["units"],
    queryFn: getUnits,
  });

  const { data: userUnitAccess = [] } = useQuery({
    queryKey: ["userUnits", editingUser?.id],
    queryFn: () => (editingUser ? getUserUnits(editingUser.id) : Promise.resolve([])),
    enabled: !!editingUser,
  });

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await updateUserRole(userId, [role]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const addUnitMutation = useMutation({
    mutationFn: async ({ userId, unitId }: { userId: string; unitId: string }) => {
      await addUserUnit(userId, unitId);
    },
  });

  const removeUnitMutation = useMutation({
    mutationFn: async ({ userId, unitId }: { userId: string; unitId: string }) => {
      await removeUserUnit(userId, unitId);
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (data: UpdateUserFormValues) => {
    if (!editingUser) return;

    try {
      const currentRole = editingUser.publicMetadata?.role?.[0] || "";
      const currentUnitIds = userUnitAccess.map((ua) => ua.unitId);
      const newUnitIds = data.unitIds || [];

      // Calculate diff
      const toAdd = newUnitIds.filter((id) => !currentUnitIds.includes(id));
      const toRemove = currentUnitIds.filter((id) => !newUnitIds.includes(id));

      // Build mutation promises
      const mutations: Promise<any>[] = [];

      // Add role update if changed
      if (data.role !== currentRole) {
        mutations.push(
          updateRoleMutation.mutateAsync({
            userId: editingUser.id,
            role: data.role,
          })
        );
      }

      // Add unit additions
      toAdd.forEach((unitId) => {
        mutations.push(
          addUnitMutation.mutateAsync({
            userId: editingUser.id,
            unitId,
          })
        );
      });

      // Add unit removals
      toRemove.forEach((unitId) => {
        mutations.push(
          removeUnitMutation.mutateAsync({
            userId: editingUser.id,
            unitId,
          })
        );
      });

      // Execute all mutations concurrently
      await Promise.all(mutations);

      toast({ title: "Alterações salvas com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["userUnits"] });
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.firstName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (u.primaryEmailAddress?.emailAddress?.toLowerCase() || "").includes(
        search.toLowerCase()
      )
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Colaboradores</h1>
          <p className="text-muted-foreground">Gestão de acesso e permissões</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Convidar Usuário
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingUsers ? (
                // Skeleton loading
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground font-medium">
                        Nenhum colaborador cadastrado
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Convide usuários para começar
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum resultado encontrado para "{search}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.imageUrl} alt={user.firstName || "User"} />
                          <AvatarFallback>
                            <Users className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{user.primaryEmailAddress?.emailAddress}</TableCell>
                    <TableCell>
                      {user.publicMetadata?.role?.map((role) => (
                        <Badge
                          key={role}
                          variant={getRoleBadgeVariant(role)}
                          className="mr-1"
                        >
                          {ROLES.find((r) => r.value === role)?.label || role}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Access Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Acesso: {editingUser?.firstName} {editingUser?.lastName}
            </DialogTitle>
          </DialogHeader>
          {editingUser && (
            <UserAccessForm
              user={editingUser}
              units={units}
              currentUnitIds={userUnitAccess.map((ua) => ua.unitId)}
              onSubmit={handleFormSubmit}
              isSubmitting={
                updateRoleMutation.isPending ||
                addUnitMutation.isPending ||
                removeUnitMutation.isPending
              }
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <InviteUserDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
      />
    </div>
  );
}
