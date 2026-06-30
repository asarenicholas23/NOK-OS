/**
 * Sends an email with one or more PDF briefs attached using Google's Gmail API.
 */
export const sendBriefEmail = async (
  accessToken: string,
  recipientEmails: string[],
  subject: string,
  bodyText: string,
  attachments: { pdfBase64: string; fileName: string }[]
): Promise<void> => {
  const boundary = "boundary_creative_brief_desk_" + Math.random().toString(36).substring(2, 9);
  const toHeader = recipientEmails.join(", ");
  
  // Construct MIME body
  const mimeParts = [
    `From: me`,
    `To: ${toHeader}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    `<div>${bodyText.replace(/\n/g, '<br />')}</div>`
  ];

  // Add each attachment
  for (const attachment of attachments) {
    mimeParts.push(
      ``,
      `--${boundary}`,
      `Content-Type: application/pdf; name="${attachment.fileName}"`,
      `Content-Disposition: attachment; filename="${attachment.fileName}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      attachment.pdfBase64
    );
  }

  // Close boundary
  mimeParts.push(``, `--${boundary}--`);

  const mimeString = mimeParts.join("\r\n");
  
  // Convert unicode string to base64url-encoded string
  // Clean base64url encoding of binary-safe unicode payload
  const utf8Bytes = new TextEncoder().encode(mimeString);
  let binary = "";
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64UrlSafe = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw: base64UrlSafe
    })
  });

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(errorDetails?.error?.message || `Gmail API returned status ${response.status}`);
  }
};
