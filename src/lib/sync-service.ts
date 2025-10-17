import { supabase } from './supabase';
import { getUnsyncedSubmissions, markSubmissionSynced } from './offline-storage';
import { toast } from 'sonner';

export const syncOfflineSubmissions = async () => {
  try {
    const unsynced = await getUnsyncedSubmissions();
    
    if (unsynced.length === 0) {
      return;
    }

    console.log(`Syncing ${unsynced.length} offline submission(s)...`);
    let successCount = 0;

    for (const submission of unsynced) {
      try {
        // Save to database
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
          console.error('Error syncing submission to DB:', dbError);
          continue;
        }

        // Send email
        try {
          await supabase.functions.invoke('send-quiz-email', {
            body: {
              userInfo: submission.userInfo,
              quizTitle: submission.quizTitle,
              answers: submission.answers,
              consents: submission.consents,
              submittedAt: submission.submittedAt,
            },
          });
        } catch (emailError) {
          console.warn('Email send failed during sync, but submission was saved:', emailError);
        }

        // Mark as synced
        await markSubmissionSynced(submission.id);
        successCount++;
      } catch (error) {
        console.error('Error syncing individual submission:', error);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} offline odpověd(í) bylo(y) odeslány!`);
    }

    if (successCount < unsynced.length) {
      toast.warning(`Některé odpovědi se nepodařilo odeslat. Zkusíme znovu později.`);
    }
  } catch (error) {
    console.error('Error in syncOfflineSubmissions:', error);
  }
};

// Setup auto-sync when user comes online
export const setupSyncListener = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('User is online, syncing submissions...');
      syncOfflineSubmissions();
    });
  }
};
