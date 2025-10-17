import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserInfo } from '@/types/quiz';
import { Lock, Loader2, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cacheQuiz } from '@/lib/quiz-cache';

const TERMS_OF_SERVICE = `🧾 Pravidla spotřebitelské soutěže

„Vyhraj Teslu na víkend – Ostrava Edition"

⸻

1. Pořadatel soutěže

Pořadatelem soutěže „Vyhraj Teslu na víkend – Ostrava Edition" (dále jen „soutěž") je společnost Tesla Czech Republic s.r.o.,
se sídlem Klimentská 1216/46, 110 00 Praha 1 – Nové Město,
IČO: 077 38 315,
zapsaná v obchodním rejstříku vedeném Městským soudem v Praze, oddíl C, vložka 307 095
(dále jen „pořadatel").

Soutěž je organizována lokálně týmem Tesla Ostrava Pop-Up Store a má komunitní, nekomerční charakter.

⸻

2. Místo a způsob konání soutěže

Soutěž probíhá v regionu Ostrava formou online marketingové aktivity.
	•	Odkaz na soutěžní kvíz je šířen prostřednictvím osobních profilů poradců Tesly, zákazníků a komunity na sociálních sítích (zejména Instagram).
	•	Nejde o oficiální aktivitu centrály Tesla, ale o lokální iniciativu na podporu povědomí o elektromobilitě a testovacích jízd v Ostravě.

⸻

3. Termín soutěže

Soutěž probíhá každý týden v kalendářním roce 2025.
	•	Soutěžní období: pondělí 00:00 – neděle 23:59
	•	Vyhlášení výherce: následující pondělí ve 12:00 hod.

⸻

4. Účast v soutěži

Účastníkem soutěže může být každá fyzická osoba, která:
	1.	dosáhla věku minimálně 18 let,
	2.	má platné řidičské oprávnění skupiny B po dobu alespoň 1 roku,
	3.	vyplní online soutěžní kvíz sdílený v rámci komunity,
	4.	správně odpoví na všechny soutěžní otázky,
	5.	uvede pravdivé kontaktní údaje (jméno a příjmení),
	6.	souhlasí s těmito pravidly a se zpracováním osobních údajů.

Účast není omezena státní příslušností ani trvalým pobytem.
Každý účastník se může zapojit pouze jednou za každé soutěžní období.

⸻

5. Výhra a její předání
	•	Výhrou v soutěži je zápůjčka vozidla Tesla na víkend zdarma, a to v rozsahu:
od soboty v 17:00 do pondělí v 10:00.
	•	Výherce bude vylosován z účastníků, kteří správně zodpověděli všechny otázky daného týdne.
	•	Při převzetí vozidla musí výherce předložit platný občanský průkaz (nebo pas) a řidičský průkaz potvrzující délku oprávnění minimálně 12 měsíců.
	•	Předání a vrácení vozidla probíhá osobně v prodejním místě Tesla Ostrava Pop-Up Store (Nákupní centrum Nová Karolina).
	•	Výhra je nepeněžitá, nepřevoditelná a nelze ji směnit za hotovost ani jinou věcnou cenu.
	•	Pokud výherce nepotvrdí zájem o výhru do 48 hodin od vyrozumění, může pořadatel vybrat náhradního výherce.

⸻

6. Odměna pro ostatní účastníky

Každý účastník, který splnil podmínky soutěže, ale nebyl vylosován, obdrží možnost hodinové testovací jízdy zdarma a individuální konzultace s poradcem Tesla Ostrava.

⸻

7. Ochrana osobních údajů (GDPR)
	•	Účastník soutěže souhlasí se zpracováním svých osobních údajů (jméno, příjmení, odpovědi v kvízu) pro účely realizace soutěže, komunikace s účastníky a následné nabídky testovací jízdy.
	•	Pořadatel zpracovává osobní údaje v souladu s nařízením (EU) 2016/679 (GDPR).
	•	Údaje jsou uchovávány pouze po dobu trvání soutěžního týdne a do vyhlášení výherce, poté jsou nenávratně smazány, s výjimkou osob, které projeví zájem o další komunikaci.
	•	Osobní údaje nejsou předávány třetím osobám ani komerčně využívány mimo rámec této soutěže.

⸻

8. Právní rámec a odpovědnost
	•	Soutěž není hazardní hrou podle zákona č. 186/2016 Sb. o hazardních hrách, jelikož účast je bezplatná, výherce je vybírán ze soutěžících, kteří správně zodpověděli otázky, a výhra nemá peněžní charakter.
	•	Soutěž má nekomerční a komunitní charakter a slouží výhradně k podpoře povědomí o elektromobilitě a značce Tesla v regionu Ostrava.
	•	Pořadatel si vyhrazuje právo upravit, zkrátit nebo zrušit soutěž bez náhrady, pokud to vyžadují provozní nebo technické okolnosti.
	•	Účastí v soutěži účastník potvrzuje, že se s těmito pravidly seznámil, souhlasí s nimi a bude se jimi řídit.
	•	V případě pochybností nebo sporů rozhoduje s konečnou platností pořadatel soutěže.

⸻

9. Kontaktní informace

Pro všechny organizační a informační záležitosti lze kontaktovat tým Tesla Ostrava Pop-Up Store přímo na místě konání nebo prostřednictvím interních komunikačních kanálů Tesly.`;

export default function CustomerRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quizId = searchParams.get('quiz');
  const [formData, setFormData] = useState<UserInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [consents, setConsents] = useState({
    terms: false,
    marketing: false,
    gdpr: false,
  });
  const [loading, setLoading] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    if (quizId) {
      loadQuizTitle();
    }
  }, [quizId]);

  const loadQuizTitle = async () => {
    if (!quizId) return;

    try {
      const { data, error } = await supabase
        .from('quiz_templates')
        .select('title, questions')
        .eq('id', quizId)
        .single();

      if (error || !data) {
        toast.error('Quiz nebyl nalezen');
        return;
      }

      setQuizTitle(data.title);

      // Cache the quiz data for offline use
      if (data.questions) {
        cacheQuiz(quizId, data.title, data.questions as any);
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error('Vyplňte prosím všechna povinná pole');
      return;
    }

    if (!consents.terms || !consents.marketing || !consents.gdpr) {
      toast.error('Musíte souhlasit se všemi podmínkami');
      return;
    }
    localStorage.setItem('userInfo', JSON.stringify(formData));
    localStorage.setItem('consents', JSON.stringify(consents));

    if (quizId) {
      navigate(`/quiz?id=${quizId}`);
    } else {
      toast.error('Chybí ID quizu');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-6 px-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                {quizTitle || 'Quiz'}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/admin/login')}
              >
                <Lock className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </div>
            <CardDescription>Vyplňte prosím své údaje pro pokračování</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {!quizId ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Chybí ID quizu. Použijte správný link.</p>
              </div>
            ) : (
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

                <div className="border-t pt-4 mt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={consents.terms}
                      onCheckedChange={(checked) =>
                        setConsents({ ...consents, terms: checked as boolean })
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="terms" className="font-normal cursor-pointer text-sm">
                        Souhlasím s{' '}
                        <button
                          type="button"
                          onClick={() => setShowTerms(true)}
                          className="text-primary hover:underline font-medium"
                        >
                          podmínkami soutěže
                        </button>
                        {' '}*
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="marketing"
                      checked={consents.marketing}
                      onCheckedChange={(checked) =>
                        setConsents({ ...consents, marketing: checked as boolean })
                      }
                    />
                    <Label htmlFor="marketing" className="font-normal cursor-pointer text-sm">
                      Souhlasím s emailovou komunikací a aktualizacemi od Tesly *
                    </Label>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="gdpr"
                      checked={consents.gdpr}
                      onCheckedChange={(checked) =>
                        setConsents({ ...consents, gdpr: checked as boolean })
                      }
                    />
                    <Label htmlFor="gdpr" className="font-normal cursor-pointer text-sm">
                      Souhlasím se zpracováním mých osobních údajů dle GDPR *
                    </Label>
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Načítání...
                    </>
                  ) : (
                    'Pokračovat na quiz'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Podmínky soutěže
            </DialogTitle>
            <DialogDescription>
              Přečtěte si prosím všechny podmínky soutěže
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
              {TERMS_OF_SERVICE}
            </div>
          </ScrollArea>
          <Button onClick={() => setShowTerms(false)} className="w-full">
            Rozumím a souhlasím
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}