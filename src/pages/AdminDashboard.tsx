import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, LogOut, Copy, Home, FileText, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { Question, Quiz } from '@/types/quiz';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [quizTitle, setQuizTitle] = useState('Můj Quiz');
  const [quizDescription, setQuizDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', question: '', options: ['', '', '', ''], type: 'single' }
  ]);
  const [savedQuizzes, setSavedQuizzes] = useState<Quiz[]>([]);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (!isAuth) {
      navigate('/admin/login');
    }
    loadSavedQuizzes();
  }, [navigate]);

  const loadSavedQuizzes = () => {
    const quizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    setSavedQuizzes(quizzes);
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

  const handleSaveQuiz = () => {
    const quiz: Quiz = {
      id: editingQuizId || Date.now().toString(),
      title: quizTitle,
      description: quizDescription,
      questions: questions,
      createdAt: editingQuizId ? savedQuizzes.find(q => q.id === editingQuizId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
    };

    let updatedQuizzes;
    if (editingQuizId) {
      updatedQuizzes = savedQuizzes.map(q => q.id === editingQuizId ? quiz : q);
      toast.success('Quiz byl úspěšně aktualizován');
    } else {
      updatedQuizzes = [...savedQuizzes, quiz];
      toast.success('Quiz byl úspěšně uložen');
    }

    localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
    setSavedQuizzes(updatedQuizzes);
    setEditingQuizId(null);
  };

  const handleNewQuiz = () => {
    setQuizTitle('Můj Quiz');
    setQuizDescription('');
    setQuestions([{ id: '1', question: '', options: ['', '', '', ''], type: 'single' }]);
    setEditingQuizId(null);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setQuizTitle(quiz.title);
    setQuizDescription(quiz.description);
    setQuestions(quiz.questions);
    setEditingQuizId(quiz.id);
  };

  const handleDeleteQuiz = (quizId: string) => {
    const updatedQuizzes = savedQuizzes.filter(q => q.id !== quizId);
    localStorage.setItem('quizzes', JSON.stringify(updatedQuizzes));
    setSavedQuizzes(updatedQuizzes);
    toast.success('Quiz byl smazán');
  };

  const copyQuizLink = (quizId?: string) => {
    const link = quizId 
      ? `${window.location.origin}/?quiz=${quizId}`
      : `${window.location.origin}/`;
    navigator.clipboard.writeText(link);
    toast.success('Link zkopírován do schránky');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Vytvořte a spravujte své quizy</p>
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

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">
              <Edit2 className="w-4 h-4 mr-2" />
              Editovat Quiz
            </TabsTrigger>
            <TabsTrigger value="saved">
              <FileText className="w-4 h-4 mr-2" />
              Uložené Quizy ({savedQuizzes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={handleNewQuiz} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Nový Quiz
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Základní informace</CardTitle>
                <CardDescription>
                  {editingQuizId ? 'Editujete existující quiz' : 'Vytvořte nový quiz'}
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

            <Button onClick={handleSaveQuiz} className="w-full" size="lg">
              {editingQuizId ? 'Aktualizovat quiz' : 'Uložit quiz'}
            </Button>
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {savedQuizzes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">Zatím nemáte žádné uložené quizy</p>
                  <Button onClick={() => document.querySelector('[value="edit"]')?.click()} variant="outline" className="mt-4">
                    Vytvořit první quiz
                  </Button>
                </CardContent>
              </Card>
            ) : (
              savedQuizzes.map((quiz) => (
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
                          <span>Vytvořeno: {new Date(quiz.createdAt).toLocaleDateString('cs-CZ')}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button onClick={() => { handleEditQuiz(quiz); document.querySelector('[value="edit"]')?.click(); }} variant="outline" className="flex-1">
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
        </Tabs>
      </div>
    </div>
  );
}