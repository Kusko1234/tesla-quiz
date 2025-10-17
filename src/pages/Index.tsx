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
      // Redirect to registration page with quiz ID immediately
      navigate(`/register?quiz=${quizId}`, { replace: true });
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-4 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/login')}
          className="gap-2"
        >
          <LinkIcon className="w-4 h-4" />
          Admin přihlášení
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Vítejte v Quiz Platformě</CardTitle>
          <CardDescription className="text-base">
            Zadejte odkaz na quiz, který chcete vyplnit
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="quizLink" className="text-base font-medium">
                Odkaz na quiz
              </Label>
              <Input
                id="quizLink"
                type="text"
                value={quizLink}
                onChange={(e) => setQuizLink(e.target.value)}
                placeholder="Vložte odkaz nebo ID quizu..."
                className="w-full h-12 text-base"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Vložte celý odkaz nebo pouze ID quizu
              </p>
            </div>
            <Button type="submit" className="w-full h-12 text-base" size="lg">
              <LinkIcon className="w-5 h-5 mr-2" />
              Pokračovat na quiz
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;