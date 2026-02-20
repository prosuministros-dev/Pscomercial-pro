import { motion } from 'motion/react';
import { 
  Zap, 
  Brain, 
  Users, 
  Plug, 
  Shield, 
  Workflow, 
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { features } from '../../lib/mock-data';
import { useTheme } from '../theme-provider';

const iconMap: Record<string, any> = {
  brain: Brain,
  users: Users,
  plug: Plug,
  shield: Shield,
  workflow: Workflow,
  smartphone: Smartphone,
};

export function Features() {
  const { gradients } = useTheme();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl p-12 text-center"
        style={{
          background: gradients 
            ? 'var(--grad-hero)' 
            : 'var(--color-accent)',
        }}
      >
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
            <Zap className="h-4 w-4 text-white" />
            <span className="text-sm text-white">Powerful Features</span>
          </div>
          <h1 className="mb-4 text-white">Everything you need to succeed</h1>
          <p className="text-white/90 text-lg">
            Built with cutting-edge technology to power your business forward
          </p>
        </div>
        <div className="absolute -right-12 -top-12 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      </motion.div>

      {/* Features Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => {
          const Icon = iconMap[feature.icon] || Zap;
          const isActive = feature.status === 'active';
          const isBeta = feature.status === 'beta';
          const isComing = feature.status === 'coming';

          return (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`p-6 h-full hover:shadow-elevated transition-all ${
                isComing ? 'opacity-75' : ''
              }`}>
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="rounded-xl p-3"
                      style={{
                        background: gradients && isActive
                          ? 'var(--grad-accent)'
                          : 'var(--color-primary)',
                      }}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    {isActive && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                    {isBeta && (
                      <Badge variant="secondary" className="gap-1">
                        <Zap className="h-3 w-3" />
                        Beta
                      </Badge>
                    )}
                    {isComing && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Soon
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>

                  <Button
                    variant={isActive ? "default" : "outline"}
                    className={`mt-6 w-full gap-2 ${
                      isActive && gradients ? 'bg-gradient-brand text-white hover:opacity-90' : ''
                    }`}
                    disabled={isComing}
                  >
                    {isActive && 'Explore Feature'}
                    {isBeta && 'Join Beta'}
                    {isComing && 'Coming Soon'}
                    {!isComing && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="p-12 text-center bg-gradient-soft">
          <div className="max-w-2xl mx-auto">
            <h2 className="mb-4">Need a custom solution?</h2>
            <p className="text-muted-foreground mb-8">
              Our team can build custom features tailored to your specific needs. 
              Let's discuss how we can help you achieve your goals.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" className="bg-gradient-brand text-white hover:opacity-90">
                Contact Sales
              </Button>
              <Button size="lg" variant="outline">
                View Documentation
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
