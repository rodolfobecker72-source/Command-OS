import { Header } from '@/components/layout/Header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Repeat, AlertTriangle, Award, Info } from 'lucide-react';

export function ScorePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Score do Cliente"
        subtitle="Entenda como o score de cada cliente é calculado"
      />

      <div className="p-4 md:p-6 space-y-6 max-w-4xl">
        {/* Resumo */}
        <Card className="card-elevated border-l-4 border-l-accent">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-accent mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">Como funciona o Score?</p>
                <p className="text-sm text-muted-foreground">
                  O <strong>Hero Client Score</strong> é calculado automaticamente com base em 3 pilares:
                  recorrência de projetos, margem real média e penalidade comercial.
                  O score varia de <strong>0 a 100 pontos</strong> e é atualizado sempre que um orçamento muda de status.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fórmula */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Fórmula do Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 text-center font-mono text-sm md:text-base">
              <span className="text-accent font-bold">Score Final</span>
              {' = '}
              <span className="text-success font-semibold">Recorrência</span>
              {' + '}
              <span className="text-success font-semibold">Margem</span>
              {' − '}
              <span className="text-destructive font-semibold">Penalidade Comercial</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Resultado limitado entre 0 e 100 pontos
            </p>
          </CardContent>
        </Card>

        {/* Pilar 1: Recorrência */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Repeat className="w-5 h-5 text-success" />
              </div>
              <div>
                <CardTitle className="text-lg">1. Recorrência de Projetos</CardTitle>
                <CardDescription>Baseado no número de projetos aprovados</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projetos Aprovados</TableHead>
                  <TableHead className="text-right">Pontos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { range: '0 projetos', points: '0 pts' },
                  { range: '1 projeto', points: '15 pts' },
                  { range: '2 projetos', points: '25 pts' },
                  { range: '3 projetos', points: '35 pts' },
                  { range: '4+ projetos', points: '50 pts (máx.)' },
                ].map((row) => (
                  <TableRow key={row.range}>
                    <TableCell>{row.range}</TableCell>
                    <TableCell className="text-right font-semibold text-success">
                      {row.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pilar 2: Margem */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <CardTitle className="text-lg">2. Margem Real Média</CardTitle>
                <CardDescription>Baseado na margem real dos projetos executados</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Margem Real Média</TableHead>
                  <TableHead className="text-right">Pontos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { range: '≥ 50%', points: '50 pts (máx.)' },
                  { range: '≥ 40%', points: '40 pts' },
                  { range: '≥ 30%', points: '30 pts' },
                  { range: '≥ 20%', points: '20 pts' },
                  { range: '≥ 10%', points: '10 pts' },
                  { range: '< 10%', points: '5 pts' },
                ].map((row) => (
                  <TableRow key={row.range}>
                    <TableCell>{row.range}</TableCell>
                    <TableCell className="text-right font-semibold text-success">
                      {row.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-3">
              * Se o cliente não possui projetos com execução registrada, os pontos de margem serão 0.
            </p>
          </CardContent>
        </Card>

        {/* Pilar 3: Penalidade */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-lg">3. Penalidade Comercial</CardTitle>
                <CardDescription>Propostas não aprovadas reduzem o score</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propostas Não Aprovadas</TableHead>
                  <TableHead className="text-right">Penalidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { range: '0 propostas', points: '0 pts' },
                  { range: '1 proposta', points: '−5 pts' },
                  { range: '2 propostas', points: '−10 pts' },
                  { range: '3 propostas', points: '−20 pts' },
                  { range: '4+ propostas', points: '−30 pts' },
                ].map((row) => (
                  <TableRow key={row.range}>
                    <TableCell>{row.range}</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">
                      {row.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Classificação */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Award className="w-5 h-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-lg">Classificação Final</CardTitle>
                <CardDescription>Categorização com base no score</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Score</TableHead>
                  <TableHead>Classificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { range: '80 – 100', label: '🥇 Cliente A' },
                  { range: '60 – 79', label: '🥈 Cliente B' },
                  { range: '40 – 59', label: '🥉 Cliente C' },
                  { range: '0 – 39', label: '⚠️ Cliente D' },
                ].map((row) => (
                  <TableRow key={row.range}>
                    <TableCell className="font-mono">{row.range}</TableCell>
                    <TableCell className="font-semibold">{row.label}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div>
              <p className="text-sm font-medium mb-3">Badges de Potencial</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    Alto potencial
                  </Badge>
                  <span className="text-xs text-muted-foreground">Recorrência ≥ 25 pts ou Margem ≥ 35 pts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    Neutro
                  </Badge>
                  <span className="text-xs text-muted-foreground">Caso padrão</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                    Alto custo comercial
                  </Badge>
                  <span className="text-xs text-muted-foreground">3+ propostas não aprovadas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
