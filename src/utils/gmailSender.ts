export interface EmailAttachment {
  base64?: string;
  pdfBase64?: string;
  fileName: string;
  mimeType?: string;
}

export interface SendEmailOptions {
  accessToken: string;
  recipientEmails: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  attachments?: EmailAttachment[];
}

/**
 * Builds a responsive, executive HTML email layout for client content approval invitations.
 */
export const buildApprovalEmailHtml = ({
  brandName,
  periodLabel,
  shareUrl,
  customNote,
  pdfFileName
}: {
  brandName: string;
  periodLabel: string;
  shareUrl: string;
  customNote?: string;
  pdfFileName?: string;
}): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} — Content Calendar Review & Approval (${periodLabel})</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0e12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0d0e12; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #15161c; border-radius: 16px; border: 1px solid #282a36; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          <!-- Top Header -->
          <tr>
            <td style="background-color: #0a0b0e; padding: 28px 32px; border-bottom: 2px solid #8b5cf6;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; color: #a78bfa; text-transform: uppercase; margin-bottom: 4px;">N.O.K OS • CLIENT APPROVAL PORTAL</div>
                    <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">${brandName}</div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #c4b5fd; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700;">
                      ${periodLabel}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px;">
              <h1 style="font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px;">
                Your Content Calendar is Ready for Review
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 20px;">
                Hello, the creative strategy and production team has prepared the upcoming multi-channel social media and content campaign roadmap for <strong>${brandName}</strong>.
              </p>

              ${customNote ? `
              <div style="background-color: #1e1f29; border-left: 3px solid #8b5cf6; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a78bfa; margin-bottom: 4px;">Note from your creative team:</div>
                <div style="font-size: 13px; color: #cbd5e1; line-height: 1.5; font-style: italic;">"${customNote.replace(/\n/g, '<br/>')}"</div>
              </div>
              ` : ''}

              <!-- Highlights -->
              <div style="background-color: #0f1015; border: 1px solid #232530; border-radius: 12px; padding: 18px; margin-bottom: 28px;">
                <div style="font-size: 12px; font-weight: 700; color: #f1f5f9; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                  What you can do in the portal:
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #94a3b8;">
                      <strong style="color: #10b981;">✓ 1-Click Approve:</strong> Approve scheduled days or the full week with one tap.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #94a3b8;">
                      <strong style="color: #f59e0b;">✎ Request Revisions:</strong> Type specific adjustments directly on any post.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; font-size: 13px; color: #94a3b8;">
                      <strong style="color: #8b5cf6;">⚡ Real-Time Sync:</strong> Zero login needed; updates our team instantly.
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <a href="${shareUrl}" target="_blank" style="display: inline-block; background-color: #8b5cf6; background-image: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.4); text-align: center;">
                      Review & Approve Calendar →
                    </a>
                  </td>
                </tr>
              </table>

              <div style="font-size: 12px; color: #64748b; line-height: 1.5; text-align: center; margin-bottom: 24px;">
                Direct Portal Link: <br/>
                <a href="${shareUrl}" style="color: #a78bfa; word-break: break-all;">${shareUrl}</a>
              </div>

              ${pdfFileName ? `
              <!-- Static PDF Attachment Notice -->
              <div style="border-top: 1px solid #232530; padding-top: 18px; font-size: 12px; color: #64748b; line-height: 1.5;">
                <strong style="color: #94a3b8;">📎 PDF Backup Attached:</strong> Attached is an executive landscape PDF export (<code style="color: #cbd5e1; background-color: #1e1f29; padding: 2px 5px; border-radius: 4px;">${pdfFileName}</code>) of the entire content schedule for your offline records.
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0a0b0e; padding: 20px 32px; border-top: 1px solid #1f212a; text-align: center;">
              <div style="font-size: 11px; color: #475569;">
                Client Approval Flow powered by <strong>N.O.K OS</strong> • Brand Workspace
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

/**
 * Sends an email with one or more PDF / Excel / CSV attachments using Google's Gmail API.
 */
export const sendBriefEmail = async (
  accessToken: string,
  recipientEmails: string[],
  subject: string,
  bodyText: string,
  attachments: EmailAttachment[] = [],
  bodyHtml?: string
): Promise<void> => {
  const boundary = "boundary_creative_brief_desk_" + Math.random().toString(36).substring(2, 9);
  const toHeader = recipientEmails.join(", ");
  
  const contentHtml = bodyHtml || `<div>${bodyText.replace(/\n/g, '<br />')}</div>`;

  // Construct MIME body
  const mimeParts = [
    `From: me`,
    `To: ${toHeader}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    btoa(unescape(encodeURIComponent(contentHtml)))
  ];

  // Add each attachment
  for (const attachment of attachments) {
    const rawBase64 = attachment.base64 || attachment.pdfBase64 || "";
    const cleanBase64 = rawBase64
      .replace(/^data:[^;]+;base64,/, "")
      .replace(/\s+/g, "");

    // Break base64 into 76-character lines according to RFC 2045 standard for MIME email attachments
    const chunkedBase64 = cleanBase64.match(/.{1,76}/g)?.join("\r\n") || cleanBase64;
    const resolvedMime = attachment.mimeType || (attachment.fileName.endsWith(".xlsx") 
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
      : attachment.fileName.endsWith(".csv") 
      ? "text/csv" 
      : "application/pdf");

    mimeParts.push(
      ``,
      `--${boundary}`,
      `Content-Type: ${resolvedMime}; name="${attachment.fileName}"`,
      `Content-Disposition: attachment; filename="${attachment.fileName}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      chunkedBase64
    );
  }

  // Close boundary
  mimeParts.push(``, `--${boundary}--`);

  const mimeString = mimeParts.join("\r\n");
  
  // Convert unicode string to base64url-encoded string
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

