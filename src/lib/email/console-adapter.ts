import { randomUUID } from 'crypto';
import type {
  EmailError,
  EmailMessage,
  IEmailAdapter,
} from './adapter';

export interface SentEmailRecord {
  id: string;
  message: EmailMessage;
  sentAt: string;
}

export class ConsoleEmailAdapter implements IEmailAdapter {
  private history: SentEmailRecord[] = [];
  private maxHistory: number;

  constructor(options?: { maxHistory?: number }) {
    this.maxHistory = options?.maxHistory ?? 100;
  }

  async send(
    message: EmailMessage
  ): Promise<{ success: boolean; messageId?: string; error?: EmailError }> {
    try {
      const messageId = `console-${randomUUID()}`;
      const record: SentEmailRecord = {
        id: messageId,
        message,
        sentAt: new Date().toISOString(),
      };

      this.history.unshift(record);
      if (this.history.length > this.maxHistory) {
        this.history.pop();
      }

      const formattedTo = Array.isArray(message.to) ? message.to.join(', ') : message.to;
      const formattedCc = message.cc ? (Array.isArray(message.cc) ? message.cc.join(', ') : message.cc) : 'none';
      const formattedBcc = message.bcc ? (Array.isArray(message.bcc) ? message.bcc.join(', ') : message.bcc) : 'none';
      const attachmentSummary = message.attachments
        ? message.attachments.map((a) => `${a.filename} (${a.contentType || 'unknown'})`).join(', ')
        : 'none';

      // Clean console log presentation for local development
      // eslint-disable-next-line no-console
      console.log(`
┌─────────────────────────────────────────────────────────────
│ [CONSOLE EMAIL DISPATCHED]
│ Message ID:   ${messageId}
│ From:         ${message.from || 'default-erp@vyaparsuite.local'}
│ To:           ${formattedTo}
│ CC:           ${formattedCc}
│ BCC:          ${formattedBcc}
│ Subject:      ${message.subject}
│ Attachments:  ${attachmentSummary}
├─────────────────────────────────────────────────────────────
│ Body (Text):
│ ${message.text ? message.text.slice(0, 300) : '(No plain text)'}
│
│ Body (HTML preview):
│ ${message.html ? message.html.slice(0, 300) : '(No HTML)'}
└─────────────────────────────────────────────────────────────
`);

      return { success: true, messageId };
    } catch (err) {
      return {
        success: false,
        error: {
          code: 'CONSOLE_EMAIL_ERROR',
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  async sendBulk(
    messages: EmailMessage[]
  ): Promise<{ results: Array<{ success: boolean; messageId?: string; error?: EmailError }> }> {
    const results: Array<{ success: boolean; messageId?: string; error?: EmailError }> = [];

    for (const message of messages) {
      const result = await this.send(message);
      results.push(result);
    }

    return { results };
  }

  async sendTemplate(
    templateId: string,
    to: string | string[],
    variables: Record<string, unknown>
  ): Promise<{ success: boolean; error?: EmailError }> {
    try {
      const formattedTo = Array.isArray(to) ? to.join(', ') : to;

      // eslint-disable-next-line no-console
      console.log(`
┌─────────────────────────────────────────────────────────────
│ [CONSOLE TEMPLATE EMAIL DISPATCHED]
│ Template ID:  ${templateId}
│ To:           ${formattedTo}
│ Variables:    ${JSON.stringify(variables, null, 2)}
└─────────────────────────────────────────────────────────────
`);

      const message: EmailMessage = {
        to,
        subject: `[Template: ${templateId}] Notification`,
        text: `Template notification: ${templateId}\nVariables: ${JSON.stringify(variables, null, 2)}`,
        html: `<p>Template notification: <strong>${templateId}</strong></p><pre>${JSON.stringify(variables, null, 2)}</pre>`,
      };

      const result = await this.send(message);
      return { success: result.success, error: result.error };
    } catch (err) {
      return {
        success: false,
        error: {
          code: 'TEMPLATE_ERROR',
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  /**
   * Inspection methods for automated tests and development debugging
   */
  getHistory(): SentEmailRecord[] {
    return [...this.history];
  }

  getLastEmail(): SentEmailRecord | undefined {
    return this.history[0];
  }

  clearHistory(): void {
    this.history = [];
  }
}

export function createConsoleEmailAdapter(options?: { maxHistory?: number }): IEmailAdapter {
  return new ConsoleEmailAdapter(options);
}
