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
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { 
  saveSubmissionOffline, 
  isOnline, 
  getUnsyncedSubmissions, 
  markSubmissionSynced 
} from '@/lib/offline-storage';
import { cacheQuiz, getCachedQuiz } from '@/lib/quiz-cache';

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
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  useEffect(() => {
    if (online) {
      syncOfflineSubmissions();
    }
  }, [online]);

  const syncOfflineSubmissions = async () => {
    const unsynced = await getUnsyncedSubmissions();
    for (const submission of unsynced) {
      try {
        const { error: dbError } = await supabase
          .from('quiz_submissions')
          .insert({
            user_info: submission.userInfo,
            quiz_id: submission.quizId,
            quiz_title: submission.quizTitle,
            answers: submission.answers,
            consents: submission.consents,
          });

        if (dbError) {
          console.error('Error syncing submission:', dbError);
          continue;
        }

        const { error: emailError } = await supabase.functions.invoke('send-quiz-email', {
          body: {
            userInfo: submission.userInfo,
            quizTitle: submission.quizTitle,
            answers: submission.answers,
            consents: submission.consents,
            submittedAt: submission.submittedAt,
          },
        });

        if (emailError) {
          console.error('Error sending email during sync:', emailError);
        }

        await markSubmissionSynced(submission.id);
        toast.success('Offline odpověď byla úspěšně synchronizována');
      } catch (error) {
        console.error('Error during offline sync:', error);
      }
    }
  };

  const loadQuiz = async () => {
    if (!quizId) return;
    try {
      setLoading(true);

      // Try to load from Supabase if online
      if (online) {
        const { data, error } = await supabase
          .from('quiz_templates')
          .select('*')
          .eq('id', quizId)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error loading quiz:', error);

          // Try to use cached version if online load fails
          const cached = getCachedQuiz(quizId);
          if (cached) {
            setQuizTitle(cached.title);
            setQuestions(cached.questions);
            toast.warning('Používám offline verzi quizu (poslední uložená verze)');
            return;
          }

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
      } else {
        // Offline - use cached version
        const cached = getCachedQuiz(quizId);
        if (cached) {
          setQuizTitle(cached.title);
          setQuestions(cached.questions);
          toast.info('Offline režim - používám poslední uloženou verzi quizu');
        } else {
          toast.error('Quiz nebyl nalezen. Nejdříve jej načtěte online.');
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error:', error);

      // Fallback to cached version on error
      const cached = getCachedQuiz(quizId);
      if (cached) {
        setQuizTitle(cached.title);
        setQuestions(cached.questions);
        toast.warning('Chyba při načítání. Používám offline verzi.');
      } else {
        toast.error('Chyba při načítání quizu');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!currentAnswer && currentAnswer !== '') {
      toast.error('Prosím vyberte odpověď');
      return;
    }

    // Save current answer
    const newAnswers = [...answers];
    const questionId = questions[currentQuestion].id;
    const existingIndex = newAnswers.findIndex(a => a.questionId === questionId);
    if (existingIndex >= 0) {
      newAnswers[existingIndex] = { questionId, answer: currentAnswer };
    } else {
      newAnswers.push({ questionId, answer: currentAnswer });
    }
    setAnswers(newAnswers);

    // Check if this is the last question
    if (currentQuestion === questions.length - 1) {
      // Submit with the newly updated answers
      setSubmitting(true);
      handleSubmit(newAnswers);
    } else {
      // Move to next question
      const nextQuestionIndex = currentQuestion + 1;
      setCurrentQuestion(nextQuestionIndex);

      // Load answer for next question if exists
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
      // Prepare answers with questions for email
      const answersWithQuestions = finalAnswers.map(answer => {
        const question = questions.find(q => q.id === answer.questionId);
        return {
          questionId: answer.questionId,
          question: question?.question || '',
          answer: answer.answer,
        };
      });

      // If offline, save to IndexedDB
      if (!online) {
        try {
          await saveSubmissionOffline({
            userInfo,
            quizId,
            quizTitle,
            answers: answersWithQuestions,
            consents,
            submittedAt: new Date().toISOString(),
          });

          toast.success('Quiz byl uložen offline. Bude odeslán jakmile se připojíte k internetu.');
          localStorage.removeItem('userInfo');
          localStorage.removeItem('consents');
          navigate('/thank-you');
          return;
        } catch (error) {
          console.error('Error saving offline:', error);
          toast.error('Chyba při ukládání quizu offline');
          return;
        }
      }

      // If online, save to database and send email
      try {
        // Save submission to database
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

        // Send email via Edge Function with consents
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
      }
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
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Otázka {currentQuestion + 1} z {questions.length}</span>
                  <div className="flex items-center gap-2">
                    {online ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <Wifi className="w-4 h-4" />
                        <span>Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-orange-600">
                        <WifiOff className="w-4 h-4" />
                        <span>Offline</span>
                      </div>
                    )}
                    <span>{Math.round(progress)}%</span>
                  </div>
                </div>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <CardTitle className="text-2xl mt-4">{question.question}</CardTitle>
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
                  {online ? 'Odesílání...' : 'Ukládání...'}
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