import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [quizLink, setQuizLink] = useState('');

  useEffect(() => {
    const quizId = searchParams.get('quiz');
    if (quizId) {
      // Redirect to registration page with quiz ID
      navigate(`/register?quiz=${quizId}`);
    }
  }, [searchParams, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!quizLink.trim()) {
      toast.error('Zadejte odkaz na quiz');
      return;
    }

    try {
      // Extract quiz ID from URL
      let quizId = '';

      if (quizLink.includes('?quiz=')) {
        // Full URL format: https://domain.com/?quiz=xyz
        const url = new URL(quizLink);
        quizId = url.searchParams.get('quiz') || '';
      } else if (quizLink.includes('/quiz/')) {
        // Alternative format: /quiz/xyz
        const parts = quizLink.split('/quiz/');
        quizId = parts[1]?.split(/[?#]/)[0] || '';
      } else {
        // Assume it's just the quiz ID
        quizId = quizLink.trim();
      }

      if (!quizId) {
        toast.error('Neplatný odkaz na quiz');
        return;
      }

      navigate(`/register?quiz=${quizId}`);
    } catch (error) {
      toast.error('Neplatný odkaz na quiz');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Vítejte v Quiz Platformě</CardTitle>
          <CardDescription className="mt-2">
            Zadejte odkaz na quiz, který chcete vyplnit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quizLink">Odkaz na quiz</Label>
              <Input
                id="quizLink"
                type="text"
                value={quizLink}
                onChange={(e) => setQuizLink(e.target.value)}
                placeholder="https://... nebo ID quizu"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Vložte celý odkaz nebo pouze ID quizu
              </p>
            </div>
            <Button type="submit" className="w-full" size="lg">
              <LinkIcon className="w-4 h-4 mr-2" />
              Pokračovat na quiz
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;