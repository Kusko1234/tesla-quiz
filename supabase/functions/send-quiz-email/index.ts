import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface QuizSubmission {
  userInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  quizTitle: string;
  answers: Array<{
    questionId: string;
    question: string;
    answer: string | string[];
  }>;
  submittedAt: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const submission: QuizSubmission = await req.json();
    const { userInfo, quizTitle, answers, submittedAt } = submission;

    // Build email HTML content
    let answersHtml = "<h2>Odpovědi:</h2><div style='margin-top: 20px;'>";
    answers.forEach((answer, index) => {
      answersHtml += `
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 8px;">
          <strong style="color: #333;">Otázka ${index + 1}:</strong> ${answer.question}<br/>
          <strong style="color: #0066cc; margin-top: 10px; display: inline-block;">Odpověď:</strong> ${Array.isArray(answer.answer) ? answer.answer.join(", ") : answer.answer}
        </div>
      `;
    });
    answersHtml += "</div>";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0066cc; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .info-box { background-color: #e8f4f8; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .info-item { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Quiz: ${quizTitle}</h1>
              <p style="margin: 10px 0 0 0;">Nové vyplnění quizu</p>
            </div>
            <div class="info-box">
              <h2 style="margin-top: 0;">Informace o uživateli:</h2>
              <div class="info-item"><strong>Jméno:</strong> ${userInfo.firstName} ${userInfo.lastName}</div>
              <div class="info-item"><strong>Email:</strong> ${userInfo.email}</div>
              <div class="info-item"><strong>Telefon:</strong> ${userInfo.phone}</div>
              <div class="info-item"><strong>Datum odeslání:</strong> ${new Date(submittedAt).toLocaleString('cs-CZ')}</div>
            </div>
            ${answersHtml}
          </div>
        </body>
      </html>
    `;

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Quiz Platform <onboarding@resend.dev>",
        reply_to: "timas.kusnir@gmail.com",
        to: ["timas.kusnir@gmail.com"],
        subject: `Quiz ${userInfo.firstName} ${userInfo.lastName}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailData = await emailResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email byl úspěšně odeslán",
        emailId: emailData.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});