import { motion } from 'motion/react';
import { Users, Mail, Crown, Shield, User } from 'lucide-react';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { teamMembers } from '../../lib/mock-data';

export function Team() {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Crown;
      case 'premium':
        return Shield;
      default:
        return User;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'premium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-brand p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1>Team Members</h1>
              <p className="text-muted-foreground mt-1">
                Manage your team and permissions
              </p>
            </div>
          </div>
          <Button className="bg-gradient-brand text-white hover:opacity-90">
            Invite Member
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: 'Total Members', value: teamMembers.length, icon: Users },
          { label: 'Admins', value: teamMembers.filter(m => m.role === 'admin').length, icon: Crown },
          { label: 'Premium', value: teamMembers.filter(m => m.role === 'premium').length, icon: Shield },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <h2 className="mt-1">{stat.value}</h2>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Team Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member, index) => {
          const RoleIcon = getRoleIcon(member.role);
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-medium transition-all">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Badge variant={getRoleBadgeVariant(member.role)} className="gap-1">
                      <RoleIcon className="h-3 w-3" />
                      {member.role}
                    </Badge>
                  </div>

                  <div>
                    <h4>{member.name}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(member.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" size="sm">
                      View Profile
                    </Button>
                    {member.role !== 'admin' && (
                      <Button variant="ghost" size="sm">
                        Manage
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Add More */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <Card className="p-12 text-center border-dashed">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-muted p-6">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3>Invite more team members</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Collaborate with your team and grow together. Invite members to join your workspace.
              </p>
            </div>
            <Button className="mt-4 bg-gradient-brand text-white hover:opacity-90">
              Send Invitation
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
