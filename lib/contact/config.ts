export function getContactEnv() {
  return {
    resendApiKey: process.env.RESEND_API_KEY?.trim() ?? "",
    fromEmail: process.env.RESEND_FROM_EMAIL?.trim() ?? "",
    toEmail: process.env.CONTACT_TO_EMAIL?.trim() ?? "",
  };
}

export function isContactConfigured(): boolean {
  const { resendApiKey, fromEmail, toEmail } = getContactEnv();
  return Boolean(resendApiKey && fromEmail && toEmail);
}
