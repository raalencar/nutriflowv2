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
  getTeams,
  updateUserRole,
  addUserTeam,
  removeUserTeam
} from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { User, Team } from "@/types";
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

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: getTeams,
  });

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await updateUserRole(userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const addTeamMutation = useMutation({
    mutationFn: async ({ userId, teamId }: { userId: string; teamId: string }) => {
      await addUserTeam(userId, teamId);
    },
  });

  const removeTeamMutation = useMutation({
    mutationFn: async ({ userId, teamId }: { userId: string; teamId: string }) => {
      await removeUserTeam(userId, teamId);
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (data: UpdateUserFormValues) => {
    if (!editingUser) return;

    try {
      const currentRole = editingUser.role;
      const currentTeamIds = editingUser.teams?.map(t => t.id) || [];
      const newTeamIds = data.teamIds || [];

      // Calculate diff
      const toAdd = newTeamIds.filter((id) => !currentTeamIds.includes(id));
      const toRemove = currentTeamIds.filter((id) => !newTeamIds.includes(id));

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

      // Add team additions
      toAdd.forEach((teamId) => {
        mutations.push(
          addTeamMutation.mutateAsync({
            userId: editingUser.id,
            teamId,
          })
        );
      });

      // Add team removals
      toRemove.forEach((teamId) => {
        mutations.push(
          removeTeamMutation.mutateAsync({
            userId: editingUser.id,
            teamId,
          })
        );
      });

      // Execute all mutations concurrently
      await Promise.all(mutations);

      toast({ title: "Alterações salvas com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
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
      (u.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(search.toLowerCase())
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
                <TableHead>Equipes</TableHead>
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
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
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
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum resultado encontrado para "{search}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {user.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {user.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeVariant(user.role)}
                        className="mr-1"
                      >
                        {ROLES.find((r) => r.value === user.role)?.label || user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.teams?.map(team => (
                          <Badge key={team.id} variant="secondary" className="text-xs">
                            {team.name}
                          </Badge>
                        ))}
                      </div>
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
              Gerenciar Acesso: {editingUser?.name}
            </DialogTitle>
          </DialogHeader>
          {editingUser && (
            <UserAccessForm
              user={editingUser}
              teams={teams}
              currentTeamIds={editingUser.teams?.map(t => t.id) || []}
              onSubmit={handleFormSubmit}
              isSubmitting={
                updateRoleMutation.isPending ||
                addTeamMutation.isPending ||
                removeTeamMutation.isPending
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
