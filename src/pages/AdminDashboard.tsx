import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, LogOut, Home, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Question, Quiz } from '@/types/quiz';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState('Můj Quiz');
  const [quizDescription, setQuizDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', question: '', options: ['', '', '', ''], type: 'single' }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (!isAuth) {
      navigate('/admin/login');
      return;
    }
    loadActiveQuiz();
  }, [navigate]);

  const loadActiveQuiz = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('active_quiz')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading quiz:', error);
        toast.error('Chyba při načítání quizu');
        return;
      }

      if (data) {
        setQuizTitle(data.title);
        setQuizDescription(data.description || '');
        setQuestions(data.questions as Question[]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Chyba při načítání quizu');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    toast.success('Odhlášení úspěšné');
    navigate('/admin/login');
  };

  const addQuestion = () => {
    if (questions.length >= 10) {
      toast.error('Maximální počet otázek je 10');
      return;
    }
    setQuestions([...questions, { 
      id: String(questions.length + 1), 
      question: '', 
      options: ['', '', '', ''], 
      type: 'single' 
    }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error('Quiz musí obsahovat alespoň 1 otázku');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const newQuestions = [...questions];
    if (field === 'question') {
      newQuestions[index].question = value;
    }
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSaveQuiz = async () => {
    try {
      setSaving(true);

      // Validate quiz data
      if (!quizTitle.trim()) {
        toast.error('Zadejte název quizu');
        return;
      }

      const hasEmptyQuestions = questions.some(q => !q.question.trim());
      if (hasEmptyQuestions) {
        toast.error('Všechny otázky musí mít vyplněný text');
        return;
      }

      const quiz = {
        id: 1,
        title: quizTitle,
        description: quizDescription,
        questions: questions,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('active_quiz')
        .upsert(quiz, { onConflict: 'id' });

      if (error) {
        console.error('Error saving quiz:', error);
        toast.error('Chyba při ukládání quizu');
        return;
      }

      toast.success('Quiz byl úspěšně uložen a je nyní aktivní!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Chyba při ukládání quizu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Načítání...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Spravujte aktivní quiz</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              Zákaznické rozhraní
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Odhlásit se
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Základní informace</CardTitle>
            <CardDescription>
              Editujte aktivní quiz - tento quiz uvidí všichni uživatelé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Název quizu</Label>
              <Input
                id="title"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Můj nový quiz"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Popis</Label>
              <Textarea
                id="description"
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                placeholder="Krátký popis quizu..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Otázky ({questions.length}/10)</h2>
            <Button onClick={addQuestion} disabled={questions.length >= 10}>
              <Plus className="w-4 h-4 mr-2" />
              Přidat otázku
            </Button>
          </div>

          {questions.map((question, qIndex) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Otázka {qIndex + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeQuestion(qIndex)}
                    disabled={questions.length <= 1}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Text otázky</Label>
                  <Input
                    value={question.question}
                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                    placeholder={`Zadejte text otázky ${qIndex + 1}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Odpovědi</Label>
                  {question.options.map((option, oIndex) => (
                    <Input
                      key={oIndex}
                      value={option}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Odpověď ${String.fromCharCode(65 + oIndex)}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={handleSaveQuiz} disabled={saving} className="w-full" size="lg">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Ukládání...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Uložit aktivní quiz
            </>
          )}
        </Button>
      </div>
    </div>
  );
}