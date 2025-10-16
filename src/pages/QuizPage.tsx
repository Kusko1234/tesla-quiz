import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Question, QuizAnswer, UserInfo } from '@/types/quiz';
import { toast } from 'sonner';

// Výchozí otázky
const defaultQuestions: Question[] = Array.from({ length: 10 }, (_, i) => ({
  id: `q${i + 1}`,
  question: `Otázka ${i + 1}`,
  options: ['Odpověď A', 'Odpověď B', 'Odpověď C', 'Odpověď D'],
  type: 'single' as const,
}));

export default function QuizPage() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [questions] = useState<Question[]>(defaultQuestions);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/');
    }
  }, [navigate]);

  const handleNext = () => {
    if (!currentAnswer) {
      toast.error('Prosím vyberte odpověď');
      return;
    }

    const newAnswers = [...answers];
    const existingIndex = newAnswers.findIndex(a => a.questionId === questions[currentQuestion].id);
    
    if (existingIndex >= 0) {
      newAnswers[existingIndex] = { questionId: questions[currentQuestion].id, answer: currentAnswer };
    } else {
      newAnswers.push({ questionId: questions[currentQuestion].id, answer: currentAnswer });
    }
    
    setAnswers(newAnswers);

    if (currentQuestion === questions.length - 1) {
      handleSubmit(newAnswers);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setCurrentAnswer('');
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const previousAnswer = answers.find(a => a.questionId === questions[currentQuestion - 1].id);
      setCurrentAnswer(previousAnswer?.answer as string || '');
    }
  };

  const handleSubmit = async (finalAnswers: QuizAnswer[]) => {
    const userInfoStr = localStorage.getItem('userInfo');
    if (!userInfoStr) return;

    const userInfo: UserInfo = JSON.parse(userInfoStr);
    
    const submission = {
      userInfo,
      quizId: 'default-quiz',
      answers: finalAnswers,
      submittedAt: new Date().toISOString(),
    };

    console.log('Quiz submission:', submission);
    toast.success('Quiz byl úspěšně odeslán!');
    
    localStorage.removeItem('userInfo');
    navigate('/thank-you');
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Otázka {currentQuestion + 1} z {questions.length}</span>
              <span>{Math.round(progress)}%</span>
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
              <Button variant="outline" onClick={handlePrevious}>
                Zpět
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1">
              {currentQuestion === questions.length - 1 ? 'Odeslat' : 'Další'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
