import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Question, QuizAnswer, UserInfo } from '@/types/quiz';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function QuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get('id');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/');
      return;
    }
    if (quizId) {
      loadQuiz();
    } else {
      toast.error('Chybí ID quizu');
      navigate('/');
    }
  }, [navigate, quizId]);

  const loadQuiz = async () => {
    if (!quizId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quiz_templates')
        .select('*')
        .eq('id', quizId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error loading quiz:', error);
        toast.error('Chyba při načítání quizu');
        navigate('/');
        return;
      }

      if (!data) {
        toast.error('Quiz nebyl nalezen');
        navigate('/');
        return;
      }

      setQuizTitle(data.title);
      setQuestions(data.questions as Question[]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Chyba při načítání quizu');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!currentAnswer) {
      toast.error('Prosím vyberte odpověď');
      return;
    }

    const newAnswers = [...answers];
    const questionId = questions[currentQuestion].id;
    const existingIndex = newAnswers.findIndex(a => a.questionId === questionId);
    if (existingIndex >= 0) {
      newAnswers[existingIndex] = { questionId, answer: currentAnswer };
    } else {
      newAnswers.push({ questionId, answer: currentAnswer });
    }
    setAnswers(newAnswers);

    if (currentQuestion === questions.length - 1) {
      setSubmitting(true);
      handleSubmit(newAnswers);
    } else {
      const nextQuestionIndex = currentQuestion + 1;
      setCurrentQuestion(nextQuestionIndex);
      const nextAnswer = newAnswers.find(a => a.questionId === questions[nextQuestionIndex].id);
      setCurrentAnswer(nextAnswer?.answer as string || '');
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      const previousQuestionIndex = currentQuestion - 1;
      const previousAnswer = answers.find(a => a.questionId === questions[previousQuestionIndex].id);
      setCurrentAnswer(previousAnswer?.answer as string || '');
      setCurrentQuestion(previousQuestionIndex);
    }
  };

  const handleSubmit = async (finalAnswers: QuizAnswer[]) => {
    const userInfoStr = localStorage.getItem('userInfo');
    const consentsStr = localStorage.getItem('consents');
    if (!userInfoStr || !quizId) {
      toast.error('Chybí uživatelské údaje');
      setSubmitting(false);
      return;
    }

    const userInfo: UserInfo = JSON.parse(userInfoStr);
    const consents = consentsStr ? JSON.parse(consentsStr) : { terms: false, marketing: false, gdpr: false };

    try {
      const answersWithQuestions = finalAnswers.map(answer => {
        const question = questions.find(q => q.id === answer.questionId);
        return {
          questionId: answer.questionId,
          question: question?.question || '',
          answer: answer.answer,
        };
      });

      const { error: dbError } = await supabase
        .from('quiz_submissions')
        .insert({
          user_info: userInfo,
          quiz_id: quizId,
          quiz_title: quizTitle,
          answers: answersWithQuestions,
          consents: consents,
        });

      if (dbError) {
        console.error('Error saving submission:', dbError);
        toast.error('Chyba při ukládání odpovědí');
        return;
      }

      const { error: emailError } = await supabase.functions.invoke('send-quiz-email', {
        body: {
          userInfo,
          quizTitle,
          answers: answersWithQuestions,
          consents,
          submittedAt: new Date().toISOString(),
        },
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        toast.warning('Odpovědi byly uloženy, ale email se nepodařilo odeslat');
      } else {
        toast.success('Quiz byl úspěšně odeslán!');
      }

      localStorage.removeItem('userInfo');
      localStorage.removeItem('consents');
      navigate('/thank-you');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Chyba při odesílání quizu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Načítání quizu...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <p className="text-lg text-muted-foreground">Žádný quiz nebyl nalezen</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Zpět na hlavní stránku
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Otázka {currentQuestion + 1} z {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <CardTitle className="text-2xl mt-4">{question.question}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {question.type === 'single' && (
            <RadioGroup value={currentAnswer} onValueChange={setCurrentAnswer}>
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {question.type === 'text' && (
            <Textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Napište vaši odpověď..."
              rows={4}
            />
          )}

          <div className="flex gap-3 pt-4">
            {currentQuestion > 0 && (
              <Button variant="outline" onClick={handlePrevious} disabled={submitting}>
                Zpět
              </Button>
            )}
            <Button onClick={handleNext} disabled={submitting} className="flex-1">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Odesílání...
                </>
              ) : (
                currentQuestion === questions.length - 1 ? 'Odeslat' : 'Další'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}