import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Clock, ListChecks } from 'lucide-react';

const queue = [
  { id: 'Q-221', title: 'Approve “Home Cleaning Pro”', age: '18m', severity: 'medium' },
  { id: 'Q-222', title: 'Review report: pricing misrepresentation', age: '42m', severity: 'high' },
  { id: 'Q-223', title: 'Verify documents: Priya Verma', age: '1h', severity: 'low' },
];

const ModeratorDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Moderator workspace</h2>
          <p className="text-muted-foreground">Focus on approvals, reports, and safety signals.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1"><ListChecks className="h-4 w-4" /> View queue</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Pending approvals</p>
            <CardTitle className="text-2xl font-bold">12</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">+4 vs yesterday</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Open reports</p>
            <CardTitle className="text-2xl font-bold">8</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">2 high severity</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Actions today</p>
            <CardTitle className="text-2xl font-bold">27</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">On track with targets</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Review queue</CardTitle>
            <p className="text-sm text-muted-foreground">Fast triage for today.</p>
          </div>
          <Badge variant="outline">Live</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {queue.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="capitalize">{item.severity}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1"><Clock className="h-4 w-4" /> {item.age}</span>
                <Button size="sm" variant="outline" className="gap-1"><AlertTriangle className="h-4 w-4" /> Review</Button>
                <Button size="sm" className="gap-1"><CheckCircle2 className="h-4 w-4" /> Resolve</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModeratorDashboard;
