export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  replyTo?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface IEmailAdapter {
  send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: EmailError }>;
  sendBulk(messages: EmailMessage[]): Promise<{ results: Array<{ success: boolean; messageId?: string; error?: EmailError }> }>;
  sendTemplate(templateId: string, to: string | string[], variables: Record<string, unknown>): Promise<{ success: boolean; error?: EmailError }>;
}

export interface EmailError {
  code: string;
  message: string;
}
