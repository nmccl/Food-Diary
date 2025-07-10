import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronLeft, ChevronRight, Coffee, Clock, Utensils, Cookie, Droplets, Pill, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toZonedTime, format } from 'date-fns-tz';
import { useNavigate } from 'react-router-dom';

interface FoodEntry {
  id: string;
  text: string;
  time: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'drinks' | 'vitamins';
}

interface DayData {
  date: string;
  entries: FoodEntry[];
  notes: string;
}

const categoryConfig = {
  breakfast: { icon: Coffee, color: 'bg-breakfast', label: 'Breakfast' },
  lunch: { icon: Utensils, color: 'bg-lunch', label: 'Lunch' },
  dinner: { icon: Clock, color: 'bg-dinner', label: 'Dinner' },
  snacks: { icon: Cookie, color: 'bg-snacks', label: 'Snacks' },
  drinks: { icon: Droplets, color: 'bg-drinks', label: 'Drinks' },
  vitamins: { icon: Pill, color: 'bg-vitamins', label: 'Vitamins/Supplements' }
};

const FoodDiary = () => {
  const navigate = useNavigate();
  const PDT_TIMEZONE = 'America/Los_Angeles';
  
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    const pdtDate = toZonedTime(now, PDT_TIMEZONE);
    return format(pdtDate, 'yyyy-MM-dd', { timeZone: PDT_TIMEZONE });
  });
  
  const [dayData, setDayData] = useState<DayData>({
    date: currentDate,
    entries: [],
    notes: ''
  });
  
  const [newEntry, setNewEntry] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof categoryConfig>('breakfast');
  const { toast } = useToast();

  // Check for midnight PDT and save to summary
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const pdtDate = toZonedTime(now, PDT_TIMEZONE);
      const hour = pdtDate.getHours();
      const minute = pdtDate.getMinutes();
      
      // If it's 12:00 AM PDT, save yesterday's data to summary
      if (hour === 0 && minute === 0) {
        const yesterday = new Date(pdtDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = format(yesterday, 'yyyy-MM-dd', { timeZone: PDT_TIMEZONE });
        
        const yesterdayData = localStorage.getItem(`food-diary-${yesterdayKey}`);
        if (yesterdayData) {
          const summaryData = JSON.parse(localStorage.getItem('food-diary-summary') || '[]');
          const parsedData = JSON.parse(yesterdayData);
          
          // Only add if not already in summary
          if (!summaryData.find((entry: any) => entry.date === yesterdayKey)) {
            summaryData.push({
              date: yesterdayKey,
              totalEntries: parsedData.entries.length,
              categoriesUsed: [...new Set(parsedData.entries.map((e: FoodEntry) => e.category))],
              hasNotes: parsedData.notes.length > 0,
              data: parsedData
            });
            localStorage.setItem('food-diary-summary', JSON.stringify(summaryData));
          }
        }
      }
    };

    // Check immediately and then every minute
    checkMidnight();
    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update current date every minute to stay in sync with PDT
  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const pdtDate = toZonedTime(now, PDT_TIMEZONE);
      const newDate = format(pdtDate, 'yyyy-MM-dd', { timeZone: PDT_TIMEZONE });
      
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
      }
    };

    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, [currentDate]);

  // Load data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem(`food-diary-${currentDate}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setDayData(parsed);
      } catch (error) {
        console.error('Error parsing saved data:', error);
        setDayData({ date: currentDate, entries: [], notes: '' });
      }
    } else {
      setDayData({ date: currentDate, entries: [], notes: '' });
    }
  }, [currentDate]);

  // Save data to localStorage
  const saveData = (data: DayData) => {
    localStorage.setItem(`food-diary-${data.date}`, JSON.stringify(data));
    setDayData(data);
  };

  const addEntry = () => {
    if (!newEntry.trim()) return;

    const entry: FoodEntry = {
      id: Date.now().toString(),
      text: newEntry.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: selectedCategory
    };

    const updatedData = {
      ...dayData,
      entries: [...dayData.entries, entry]
    };

    saveData(updatedData);
    setNewEntry('');
    toast({
      title: "Entry added!",
      description: `Added ${categoryConfig[selectedCategory].label.toLowerCase()} entry.`
    });
  };

  const deleteEntry = (entryId: string) => {
    const updatedData = {
      ...dayData,
      entries: dayData.entries.filter(entry => entry.id !== entryId)
    };
    saveData(updatedData);
    toast({
      title: "Entry deleted",
      description: "Food entry has been removed."
    });
  };

  const updateNotes = (notes: string) => {
    const updatedData = {
      ...dayData,
      notes
    };
    saveData(updatedData);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentPdtDate = toZonedTime(new Date(currentDate), PDT_TIMEZONE);
    currentPdtDate.setDate(currentPdtDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(format(currentPdtDate, 'yyyy-MM-dd', { timeZone: PDT_TIMEZONE }));
  };

  const formatDate = (dateString: string) => {
    const date = toZonedTime(new Date(dateString), PDT_TIMEZONE);
    const formatted = format(date, 'EEEE, MMMM do, yyyy', { timeZone: PDT_TIMEZONE });
    const time = format(toZonedTime(new Date(), PDT_TIMEZONE), 'h:mm a', { timeZone: PDT_TIMEZONE });
    return `${formatted} (PDT) - ${time}`;
  };

  const getEntriesByCategory = (category: keyof typeof categoryConfig) => {
    return dayData.entries.filter(entry => entry.category === category);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <h1 className="text-4xl md:text-5xl font-bold">Food Diary</h1>
          </div>
          
          {/* Date Navigation */}
          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateDate('prev')}
              className="border-primary/20 hover:bg-primary/5"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">
                {formatDate(currentDate)}
              </h2>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigateDate('next')}
              className="border-primary/20 hover:bg-primary/5"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Summary Button */}
          <Button 
            onClick={() => navigate('/summary')}
            variant="outline"
            className="border-accent/50 hover:bg-accent/10 text-accent hover:text-accent"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Summary
          </Button>
        </div>

        {/* Add New Entry */}
        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary">Add Food Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryConfig).map(([key, config]) => {
                const Icon = config.icon;
                const shortLabel = key === 'vitamins' ? 'Vitamins' : config.label;
                return (
                  <Button
                    key={key}
                    variant={selectedCategory === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(key as keyof typeof categoryConfig)}
                    className={`${selectedCategory === key ? config.color : "border-primary/20 hover:bg-primary/5"} text-xs sm:text-sm`}
                    title={config.label} // Show full text on hover
                  >
                    <Icon className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                    <span className="truncate">{shortLabel}</span>
                  </Button>
                );
              })}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="What did you eat/drink?"
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addEntry()}
                className="border-primary/20 focus:border-primary"
              />
              <Button onClick={addEntry} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Food Categories */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(categoryConfig).map(([category, config]) => {
            const Icon = config.icon;
            const entries = getEntriesByCategory(category as keyof typeof categoryConfig);
            
            return (
              <Card key={category} className="border-primary/10 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <div className={`p-2 rounded-lg ${config.color} text-white flex-shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1 min-w-0 text-sm font-medium truncate">
                      {config.label}
                    </span>
                    <Badge variant="secondary" className="flex-shrink-0">
                      {entries.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {entries.length === 0 ? (
                    <p className="text-muted-foreground text-sm italic">No entries yet</p>
                  ) : (
                    entries.map((entry) => (
                      <div 
                        key={entry.id}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{entry.text}</p>
                          <p className="text-xs text-muted-foreground">{entry.time}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEntry(entry.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Daily Notes */}
        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary">Daily Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="How are you feeling today? Any observations about your eating habits?"
              value={dayData.notes}
              onChange={(e) => updateNotes(e.target.value)}
              className="min-h-24 border-primary/20 focus:border-primary resize-none"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FoodDiary;