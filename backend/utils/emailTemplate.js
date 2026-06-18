export const generateEmailTemplate = ({
  userName,
  userEmail,
  userPhone,
  caseType,
  caseLocation,
  aiSummary,
  lawyerName,
  lawyerEmail,
  documentAttached,
}) => {
  const subject =
    `Legal Consultation Request - ${caseType} | ${caseLocation}`;

  const body = `Hello ${lawyerName},

I am seeking legal assistance regarding a ${caseType} in ${caseLocation}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CASE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${aiSummary || "Please contact me to discuss the details of my case."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MY CONTACT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name  : ${userName}
Email : ${userEmail}
Phone : ${userPhone}
${documentAttached
  ? "\n📎 Relevant documents are attached for your reference."
  : ""}

Please contact me at your earliest convenience.

Regards,
${userName}

─────────────────────────────
Sent via LegalMind Platform`;

  // Gmail deep link - opens Gmail compose with pre-filled data
  const gmailLink =
    `https://mail.google.com/mail/?view=cm&fs=1` +
    `&to=${encodeURIComponent(lawyerEmail)}` +
    `&su=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  // Fallback mailto link
  const mailtoLink =
    `mailto:${lawyerEmail}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  return {
    subject,
    body,
    gmailLink,
    mailtoLink,
    lawyerEmail,
  };
};