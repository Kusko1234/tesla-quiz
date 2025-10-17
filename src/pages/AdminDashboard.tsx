import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, LogOut, Home, Save, Loader2, Copy, Edit2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Question, QuizTemplate } from '@/types/quiz';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState('Můj Quiz');
  const [quizDescription, setQuizDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', question: '', options: ['', '', '', ''], type: 'single' }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quizTemplates, setQuizTemplates] = useState<QuizTemplate[]>([]);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('templates');

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (!isAuth) {
      navigate('/admin/login');
      return;
    }
    loadQuizTemplates();
  }, [navigate]);

  const loadQuizTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quiz_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading quiz templates:', error);
        toast.error('Chyba při načítání quizů');
        return;
      }

      setQuizTemplates(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Chyba při načítání quizů');
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
    if (questions.length >= 20) {
      toast.error('Maximální počet otázek je 20');
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

  const handleNewQuiz = () => {
    setQuizTitle('Nový Quiz');
    setQuizDescription('');
    setQuestions([{ id: '1', question: '', options: ['', '', '', ''], type: 'single' }]);
    setEditingQuizId(null);
    setActiveTab('edit');
  };

  const handleEditQuiz = (quiz: QuizTemplate) => {
    setQuizTitle(quiz.title);
    setQuizDescription(quiz.description || '');
    setQuestions(quiz.questions as Question[]);
    setEditingQuizId(quiz.id);
    setActiveTab('edit');
  };
  const handleSaveQuiz = async () => {
    try {
      setSaving(true);

      if (!quizTitle.trim()) {
        toast.error('Zadejte název quizu');
        return;
      }

      const hasEmptyQuestions = questions.some(q => !q.question.trim());
      if (hasEmptyQuestions) {
        toast.error('Všechny otázky musí mít vyplněný text');
        return;
      }

      const quizData = {
        title: quizTitle,
        description: quizDescription,
        questions: questions,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (editingQuizId) {
        // Update existing quiz
        const { error } = await supabase
          .from('quiz_templates')
          .update(quizData)
          .eq('id', editingQuizId);

        if (error) {
          console.error('Error updating quiz:', error);
          toast.error('Chyba při aktualizaci quizu');
          return;
        }
        toast.success('Quiz byl úspěšně aktualizován!');
      } else {
        // Create new quiz
        const { error } = await supabase
          .from('quiz_templates')
          .insert(quizData);

        if (error) {
          console.error('Error creating quiz:', error);
          toast.error('Chyba při vytváření quizu');
          return;
        }
        toast.success('Quiz byl úspěšně vytvořen!');
      }

      await loadQuizTemplates();
      setActiveTab('templates');
      handleNewQuiz();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Chyba při ukládání quizu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Opravdu chcete smazat tento quiz?')) return;

    try {
      const { error } = await supabase
        .from('quiz_templates')
        .delete()
        .eq('id', quizId);

      if (error) {
        console.error('Error deleting quiz:', error);
        toast.error('Chyba při mazání quizu');
        return;
      }

      toast.success('Quiz byl úspěšně smazán');
      await loadQuizTemplates();

      if (editingQuizId === quizId) {
        handleNewQuiz();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Chyba při mazání quizu');
    }
  };

  const copyQuizLink = (quizId: string) => {
    // Use the Netlify production URL for the quiz link
    const netlifyUrl = 'https://tesla-quiz.netlify.app';
    const link = `${netlifyUrl}/?quiz=${quizId}`;
    navigator.clipboard.writeText(link);
    toast.success('Odkaz zkopírován: ' + link);
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
            <p className="text-muted-foreground mt-2">Spravujte šablony quizů</p>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">
              <FileText className="w-4 h-4 mr-2" />
              Šablony Quizů ({quizTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="edit">
              <Edit2 className="w-4 h-4 mr-2" />
              {editingQuizId ? 'Editovat Quiz' : 'Nový Quiz'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleNewQuiz}>
                <Plus className="w-4 h-4 mr-2" />
                Vytvořit nový quiz
              </Button>
            </div>

            {quizTemplates.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">Zatím nemáte žádné quizy</p>
                  <Button onClick={handleNewQuiz} variant="outline" className="mt-4">
                    Vytvořit první quiz
                  </Button>
                </CardContent>
              </Card>
            ) : (
              quizTemplates.map((quiz) => (
                <Card key={quiz.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{quiz.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {quiz.description || 'Bez popisu'}
                        </CardDescription>
                        <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                          <span>{quiz.questions.length} otázek</span>
                          <span>Vytvořeno: {new Date(quiz.created_at).toLocaleDateString('cs-CZ')}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button onClick={() => handleEditQuiz(quiz)} variant="outline" className="flex-1">
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editovat
                      </Button>
                      <Button onClick={() => copyQuizLink(quiz.id)} variant="outline" className="flex-1">
                        <Copy className="w-4 h-4 mr-2" />
                        Zkopírovat link
                      </Button>
                      <Button onClick={() => handleDeleteQuiz(quiz.id)} variant="destructive" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingQuizId ? 'Editovat quiz' : 'Vytvořit nový quiz'}
              </h2>
              {editingQuizId && (
                <Button onClick={handleNewQuiz} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Nový quiz
                </Button>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Základní informace</CardTitle>
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
                <h2 className="text-2xl font-bold">Otázky ({questions.length}/20)</h2>
                <Button onClick={addQuestion} disabled={questions.length >= 20}>
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
                  {editingQuizId ? 'Aktualizovat quiz' : 'Uložit nový quiz'}
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}