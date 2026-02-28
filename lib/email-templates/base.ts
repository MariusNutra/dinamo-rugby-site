/**
 * Base email template wrapper for CS Dinamo București Rugby.
 *
 * Wraps any HTML content in a responsive, table-based email layout
 * compatible with all major email clients (Outlook, Gmail, Yahoo, Apple Mail).
 */

const CLUB_NAME = 'CS Dinamo București Rugby'
const LOGO_URL = 'https://dinamorugby.ro/images/dinamo-rugby-logo.png'
const SITE_URL = 'https://dinamorugby.ro'

// Brand colors
const COLOR_BLUE = '#1e3a5f'
const COLOR_RED = '#dc2626'
const COLOR_BG = '#f3f4f6'
const COLOR_WHITE = '#ffffff'
const COLOR_TEXT = '#333333'
const COLOR_TEXT_LIGHT = '#666666'
const COLOR_TEXT_MUTED = '#999999'
const COLOR_BORDER = '#e5e7eb'

interface WrapOptions {
  preheader?: string
}

export function wrapInTemplate(content: string, options?: WrapOptions): string {
  const preheader = options?.preheader || ''

  return `<!DOCTYPE html>
<html lang="ro" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${CLUB_NAME}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; }
      .content-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLOR_BG}; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.6; color: ${COLOR_TEXT};">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>` : ''}
  ${preheader ? '<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>' : ''}

  <!-- Full-width background wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${COLOR_BG};">
    <tr>
      <td align="center" style="padding: 20px 10px;">

        <!-- Email container (max 600px) -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; width: 100%; margin: 0 auto;">

          <!-- Header -->
          <tr>
            <td style="background-color: ${COLOR_BLUE}; padding: 24px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <img src="${LOGO_URL}" alt="${CLUB_NAME}" width="60" height="60" style="display: block; margin: 0 auto; width: 60px; height: 60px; border-radius: 50%; background-color: ${COLOR_WHITE};">
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 20px; font-weight: bold; color: ${COLOR_WHITE}; line-height: 1.3;">
                    ${CLUB_NAME}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: ${COLOR_WHITE}; padding: 35px 30px;" class="content-padding">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${COLOR_WHITE}; border-top: 1px solid ${COLOR_BORDER}; padding: 25px 30px; border-radius: 0 0 8px 8px;" class="content-padding">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <!-- Social links -->
                <tr>
                  <td align="center" style="padding-bottom: 15px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 0 8px;">
                          <a href="https://www.facebook.com/dinamorugby" target="_blank" style="color: ${COLOR_BLUE}; text-decoration: none; font-size: 13px; font-family: Arial, Helvetica, sans-serif;">Facebook</a>
                        </td>
                        <td style="color: ${COLOR_BORDER}; font-size: 13px;">|</td>
                        <td style="padding: 0 8px;">
                          <a href="https://www.instagram.com/dinamorugby" target="_blank" style="color: ${COLOR_BLUE}; text-decoration: none; font-size: 13px; font-family: Arial, Helvetica, sans-serif;">Instagram</a>
                        </td>
                        <td style="color: ${COLOR_BORDER}; font-size: 13px;">|</td>
                        <td style="padding: 0 8px;">
                          <a href="${SITE_URL}" target="_blank" style="color: ${COLOR_BLUE}; text-decoration: none; font-size: 13px; font-family: Arial, Helvetica, sans-serif;">Website</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Club address -->
                <tr>
                  <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: ${COLOR_TEXT_MUTED}; line-height: 1.5; padding-bottom: 10px;">
                    ${CLUB_NAME}<br>
                    Str. Stadionului nr. 1, Sector 2, București
                  </td>
                </tr>

                <!-- Unsubscribe -->
                <tr>
                  <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: ${COLOR_TEXT_MUTED}; line-height: 1.5;">
                    <a href="${SITE_URL}/dezabonare" style="color: ${COLOR_TEXT_MUTED}; text-decoration: underline;">Dezabonare</a> &bull;
                    <a href="${SITE_URL}/confidentialitate" style="color: ${COLOR_TEXT_MUTED}; text-decoration: underline;">Politica de confidentialitate</a>
                  </td>
                </tr>

                <!-- Copyright -->
                <tr>
                  <td align="center" style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: ${COLOR_TEXT_MUTED}; padding-top: 10px;">
                    &copy; ${new Date().getFullYear()} ${CLUB_NAME}. Toate drepturile rezervate.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End email container -->

      </td>
    </tr>
  </table>
  <!-- End background wrapper -->

</body>
</html>`
}

export { CLUB_NAME, LOGO_URL, SITE_URL, COLOR_BLUE, COLOR_RED, COLOR_BG, COLOR_WHITE, COLOR_TEXT, COLOR_TEXT_LIGHT, COLOR_TEXT_MUTED, COLOR_BORDER }
