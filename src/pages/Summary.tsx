import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Coffee, Clock, Utensils, Cookie, Droplets, Pill, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toZonedTime, format } from 'date-fns-tz';

interface SummaryEntry {
  date: string;
  totalEntries: number;
  categoriesUsed: string[];
  hasNotes: boolean;
  data: {
    date: string;
    entries: Array<{
      id: string;
      text: string;
      time: string;
      category: string;
    }>;
    notes: string;
  };
}

const categoryConfig = {
  breakfast: { icon: Coffee, color: 'bg-breakfast', label: 'Breakfast' },
  lunch: { icon: Utensils, color: 'bg-lunch', label: 'Lunch' },
  dinner: { icon: Clock, color: 'bg-dinner', label: 'Dinner' },
  snacks: { icon: Cookie, color: 'bg-snacks', label: 'Snacks' },
  drinks: { icon: Droplets, color: 'bg-drinks', label: 'Drinks' },
  vitamins: { icon: Pill, color: 'bg-vitamins', label: 'Vitamins/Supplements' }
};

const Summary = () => {
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState<SummaryEntry[]>([]);
  const PDT_TIMEZONE = 'America/Los_Angeles';

  useEffect(() => {
    const loadSummaryData = () => {
      const saved = localStorage.getItem('food-diary-summary');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Sort by date, most recent first
          parsed.sort((a: SummaryEntry, b: SummaryEntry) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setSummaryData(parsed);
        } catch (error) {
          console.error('Error parsing summary data:', error);
          setSummaryData([]);
        }
      }
    };

    loadSummaryData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = toZonedTime(new Date(dateString), PDT_TIMEZONE);
    return format(date, 'EEEE, MMMM do, yyyy', { timeZone: PDT_TIMEZONE });
  };

  const getTotalStats = () => {
    const totalDays = summaryData.length;
    const totalEntries = summaryData.reduce((sum, day) => sum + day.totalEntries, 0);
    const daysWithNotes = summaryData.filter(day => day.hasNotes).length;
    const avgEntriesPerDay = totalDays > 0 ? (totalEntries / totalDays).toFixed(1) : '0';

    return { totalDays, totalEntries, daysWithNotes, avgEntriesPerDay };
  };

  const getCategoryStats = () => {
    const categoryCount: Record<string, number> = {};
    
    summaryData.forEach(day => {
      day.data.entries.forEach(entry => {
        categoryCount[entry.category] = (categoryCount[entry.category] || 0) + 1;
      });
    });

    return Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        config: categoryConfig[category as keyof typeof categoryConfig]
      }))
      .sort((a, b) => b.count - a.count);
  };

  const stats = getTotalStats();
  const categoryStats = getCategoryStats();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="border-primary/20 hover:bg-primary/5"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <h1 className="text-3xl md:text-4xl font-bold">Food Diary Summary</h1>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/10 shadow-lg">
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold text-foreground">{stats.totalDays}</div>
              <div className="text-sm text-muted-foreground">Total Days</div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-lg">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold text-foreground">{stats.totalEntries}</div>
              <div className="text-sm text-muted-foreground">Total Entries</div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.avgEntriesPerDay}</div>
              <div className="text-sm text-muted-foreground">Avg per Day</div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.daysWithNotes}</div>
              <div className="text-sm text-muted-foreground">Days with Notes</div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        {categoryStats.length > 0 && (
          <Card className="border-primary/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-primary">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {categoryStats.map(({ category, count, config }) => {
                  const Icon = config.icon;
                  return (
                    <div key={category} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className={`p-2 rounded-lg ${config.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{config.label}</div>
                        <div className="text-sm text-muted-foreground">{count} entries</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Summaries */}
        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary">Daily History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summaryData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No summary data available yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Daily summaries are automatically created at 12:00 AM PDT.
                </p>
              </div>
            ) : (
              summaryData.map((day) => (
                <div key={day.date} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{formatDate(day.date)}</h3>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{day.totalEntries} entries</Badge>
                      {day.hasNotes && <Badge variant="outline">Has notes</Badge>}
                    </div>
                  </div>

                  {/* Categories used */}
                  <div className="flex flex-wrap gap-2">
                    {day.categoriesUsed.map((category) => {
                      const config = categoryConfig[category as keyof typeof categoryConfig];
                      const Icon = config.icon;
                      const categoryEntries = day.data.entries.filter(e => e.category === category);
                      
                      return (
                        <div key={category} className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-sm">
                          <div className={`p-1 rounded ${config.color} text-white`}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <span className="text-muted-foreground">{categoryEntries.length}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Sample entries */}
                  {day.data.entries.slice(0, 3).map((entry) => (
                    <div key={entry.id} className="text-sm text-muted-foreground pl-4">
                      • {entry.text} ({entry.time})
                    </div>
                  ))}
                  
                  {day.data.entries.length > 3 && (
                    <div className="text-sm text-muted-foreground pl-4">
                      ... and {day.data.entries.length - 3} more entries
                    </div>
                  )}

                  {day.data.notes && (
                    <div className="mt-2 p-3 bg-muted/30 rounded text-sm">
                      <strong>Notes:</strong> {day.data.notes.slice(0, 100)}
                      {day.data.notes.length > 100 && '...'}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Summary;