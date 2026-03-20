import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import fs from 'node:fs/promises'
import path from 'node:path'

function client() {
  const region =
    process.env.AWS_REGION ||
    (process.env.COGNITO_USER_POOL_ID ? process.env.COGNITO_USER_POOL_ID.split('_')[0] : null)
  if (!region) throw new Error('AWS_REGION or COGNITO_USER_POOL_ID is required')
  const endpoint = process.env.AWS_ENDPOINT_URL
  return new SESClient({ region, endpoint: endpoint || undefined })
}

function fromEmail() {
  const v = process.env.SES_FROM_EMAIL
  if (!v) throw new Error('SES_FROM_EMAIL is required')
  return v
}

export async function renderTemplate(templateName: string, vars: Record<string, string>) {
  const file = path.resolve(process.cwd(), 'code/emails/templates', templateName)
  let html = await fs.readFile(file, 'utf8')
  for (const [k, v] of Object.entries(vars)) {
    html = html.replaceAll(`{{${k}}}`, v)
  }
  return html
}

export async function sendInvitationEmail(params: {
  to: string
  teamName: string
  inviterName: string
  acceptUrl: string
  rejectUrl: string
}) {
  const html = await renderTemplate('team-invitation.html', {
    team_name: params.teamName,
    inviter_name: params.inviterName,
    accept_url: params.acceptUrl,
    reject_url: params.rejectUrl
  })

  await client().send(
    new SendEmailCommand({
      Source: fromEmail(),
      Destination: { ToAddresses: [params.to] },
      Message: {
        Subject: { Data: `Invitation à rejoindre ${params.teamName}`, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } }
      }
    })
  )

  return { ok: true }
}

