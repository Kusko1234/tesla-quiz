import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserInfo } from '@/types/quiz';
import { Lock } from 'lucide-react';

export default function CustomerRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      return;
    }

    localStorage.setItem('userInfo', JSON.stringify(formData));
    navigate('/quiz');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/admin/login')}
          >
            <Lock className="w-4 h-4 mr-2" />
            Admin přihlášení
          </Button>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-bold">Vítejte v Quiz platformě</CardTitle>
            <CardDescription>Vyplňte prosím své údaje pro pokračování</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Jméno *</Label>
                <Input
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Zadejte vaše jméno"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Příjmení *</Label>
                <Input
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Zadejte vaše příjmení"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="vas@email.cz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+420 123 456 789"
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Pokračovat
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}